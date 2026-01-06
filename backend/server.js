import { cortiClient } from './cortiClient.js';
import { predictCodes } from './codingHelper.js';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { Readable } from 'stream';

const app = express();
const upload = multer();

app.use(cors());
app.use(express.json());

// Create interaction
app.post("/api/interactions", async (req, res) => {
    try {
        const interaction = await cortiClient.interactions.create({
            encounter: {
                identifier: `encounter-${Date.now()}`,
                status: "planned",
                type: "first_consultation",
            }
        });
        
        console.log("Interaction created:", interaction.interactionId);
        res.json(interaction);
    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Upload recording
app.post("/api/interactions/:id/recording", upload.single("audio"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No audio file uploaded" });
        }

        let interactionId = req.params.id;
        let audioBuffer = req.file.buffer;

        const fileStream = Readable.from(audioBuffer);
        const recording = await cortiClient.recordings.upload(fileStream, interactionId);

        console.log("Recording uploaded:", recording);
        res.json(recording);
    } catch (err) {
        console.error("Upload error:", err);
        res.status(500).json({ error: "Failed to upload recording" });
    }
});

// // Create transcript
// app.post("/api/interactions/:id/transcripts", async (req, res) => {
//     try {
//         const { recordingId, primaryLanguage } = req.body;

//         if (!recordingId) {
//             return res.status(400).json({ error: "recordingId is required" });
//         }

//         const interactionId = req.params.id;

//         const transcript = await cortiClient.transcripts.create(interactionId, recordingId, primaryLanguage);

//         res.json(transcript);
//     } catch (err) {
//         console.error("Create transcript error:", err);
//         res.status(500).json({ error: "Failed to create transcript" });
//     }
// });

// // Extract facts (stateless)
// app.post("/api/tools/extract-facts", async (req, res) => {
//     try {
//         const { text, primaryLanguage: outputLanguage } = req.body;

//         const facts = await cortiClient.facts.extract({
//             context: [{
//                 type: 'text',
//                 text: text
//             }],
//             outputLanguage: outputLanguage
//         });

//         res.json(facts);
//     } catch (err) {
//         console.error("Extract facts error:", err);
//         res.status(500).json({ error: "Failed to extract facts" });
//     }
// });

// List available templates
app.get("/api/templates", async (req, res) => {
    try {
        const response = await cortiClient.templates.list();
        const templates = response.data;
        
        console.log(`Found ${templates.length} templates`);
        res.json(templates);
    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Generate Document
app.post("/api/interactions/:id/documents", async (req, res) => {
    try {
        const interactionId = req.params.id;
        const { recordingId, primaryLanguage = 'en', templateKey, outputLanguage = 'en' } = req.body;

        if (!templateKey) {
            return res.status(400).json({ error: "templateKey is required" });
        }

        const transcriptsResponse = await cortiClient.transcripts.create(interactionId, {
            recordingId: recordingId,
            primaryLanguage: primaryLanguage
        });

        // // // List of transcript objects
        // // const transcripts = transcriptsResponse.transcripts.map(transcript => ({
        // //     type: 'text',
        // //     text: transcript.text
        // // }));

        // // One big transcript
        // const transcripts = transcriptsResponse.transcripts.map(t => t.text).join(" ");

        // const factResponse = await cortiClient.facts.extract({
        //     context: [{
        //         type: 'text',
        //         text: transcripts
        //     }],
        //     // context: transcripts,
        //     outputLanguage: outputLanguage
        // });

        // const combinedFacts = factResponse.facts;
        
        // Map over each transcript and extract facts
        const factExtractionPromises = transcriptsResponse.transcripts.map(async (transcript) => {
            const factsResponse = await cortiClient.facts.extract({
                context: [{ 
                    type: 'text', 
                    text: transcript.text 
                }],
                outputLanguage: outputLanguage
            });
            return factsResponse.facts;
        });

        // Wait for all extractions and combine
        const allFactsArrays = await Promise.all(factExtractionPromises);
        const combinedFacts = allFactsArrays.flat();

        const context = [{
            type: 'facts',
            data: combinedFacts.map(fact => ({
                text: fact.value,
                source: 'core',
                group: fact.group
            }))
        }];

        const document = await cortiClient.documents.create(
            interactionId,
            {
                context: context,
                templateKey: templateKey,
                outputLanguage: outputLanguage,
            }
        );

        console.log("Document generated:", document.id);
        res.json(document);
    } catch (err) {
        console.error("Generate document error:", err);
        res.status(500).json({ error: "Failed to generate document" });
    }
});

// Predict codes (stateless)
app.post("/api/tools/coding", async (req, res) => {
    try {
        const system = ["icd10cm", "icd10pcs", "cpt"];
        const { documentId, maxCandidates = 5 } = req.body;

        if (!documentId) {
            return res.status(400).json({ error: "documentId is required" });
        }

        const context = [{
            type: 'documentId',
            documentId: documentId
        }];

        const codes = await predictCodes(system, context, maxCandidates);

        console.log("Code predictions and all possible code candidates generated")
        res.json(codes);
    } catch (err) {
        console.error("Predict codes error:", err);
        res.status(500).json({ error: "Failed to predict codes" });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});