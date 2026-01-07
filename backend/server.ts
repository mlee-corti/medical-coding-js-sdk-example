import cortiClient from './cortiClient.js';
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
                status: "planned" as const,             // TypeScript needs to know the string is an enum
                type: "first_consultation" as const,
            }
        });
        
        console.log("Interaction created:", interaction.interactionId);
        res.json(interaction);
    } catch (err) {
        if (err instanceof Error) {
            console.log("Error:", err.message);
            res.status(500).json({ error: err.message });
        } else {
            console.error("Unknown error:", err);
            res.status(500).json({ error: "An unknown error occurred" });
        }
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
        if (err instanceof Error) {
            console.log("Error:", err.message);
            res.status(500).json({ error: err.message });
        } else {
            console.error("Unknown error:", err);
            res.status(500).json({ error: "An unknown error occurred" });
        }
    }
});

// List available templates
app.get("/api/templates", async (req, res) => {
    try {
        const response = await cortiClient.templates.list();
        const templates = response.data;
        
        console.log(`Found ${templates.length} templates`);
        res.json(templates);
    } catch (err) {
        if (err instanceof Error) {
            console.log("Error:", err.message);
            res.status(500).json({ error: err.message });
        } else {
            console.error("Unknown error:", err);
            res.status(500).json({ error: "An unknown error occurred" });
        }
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
        if (!transcriptsResponse) {
            return res.status(500).json({ error: "Error: no transcript response" });
        }

        if (!transcriptsResponse.transcripts) {
            return res.status(400).json({ error: "Error: no transcripts were created "});
        }
        
        // Map over each transcript and extract facts
        const factExtractionPromises = transcriptsResponse.transcripts.map(async (transcript) => {
            const factsResponse = await cortiClient.facts.extract({
                context: [{ 
                    type: 'text' as const, 
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
            type: 'facts' as const,
            data: combinedFacts.map(fact => ({
                text: fact.value,
                source: 'core' as const,
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
        if (err instanceof Error) {
            console.log("Error:", err.message);
            res.status(500).json({ error: err.message });
        } else {
            console.error("Unknown error:", err);
            res.status(500).json({ error: "An unknown error occurred" });
        }
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
            type: 'documentId' as const,
            documentId: documentId
        }];

        const codes = await predictCodes(system, context, maxCandidates);

        console.log("Code predictions and all possible code candidates generated")
        res.json(codes);
    } catch (err) {
        if (err instanceof Error) {
            console.log("Error:", err.message);
            res.status(500).json({ error: err.message });
        } else {
            console.error("Unknown error:", err);
            res.status(500).json({ error: "An unknown error occurred" });
        }
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});