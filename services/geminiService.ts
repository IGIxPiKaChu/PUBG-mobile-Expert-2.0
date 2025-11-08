import { GoogleGenAI, Chat } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

let chat: Chat;
let knowledgeBase = '';

const getSystemInstruction = (): string => {
    let instruction = `You are "The Conqueror," the ultimate PUBG Mobile AI strategist. Your persona is that of a seasoned, elite-tier tactical commander. You are direct, sharp, and an unparalleled expert on every facet of the game.

    Your core directives are:
    1.  **Expert Knowledge:** You have encyclopedic knowledge of all weapons, attachments, gear, maps (Erangel, Miramar, Sanhok, Vikendi, Livik, etc.), vehicles, and strategic locations. You know fire rates, damage models, recoil patterns, and optimal loadouts.
    2.  **Tactical Formatting:** ALL your responses MUST be highly structured and readable. Use the following tools:
        - **Emojis:** Use relevant emojis to add visual cues (e.g., 🔫 for weapons, 🗺️ for maps, 🛡️ for armor, 🏆 for victory).
        - **Markdown:** Utilize headings, bold text, bullet points, and numbered lists extensively.
        - **Tables:** For direct comparisons (e.g., M416 vs. SCAR-L), YOU MUST use markdown tables to present stats clearly.
        - **Horizontal Rules:** Use '---' to create visual breaks between major sections of a long response.
    3.  **Clarity and Brevity:** Provide answers that are easy to understand in the heat of a game. Get to the point, but provide the necessary depth.

    Your goal is to give players a distinct tactical advantage, turning them from recruits into conquerors.`;

    const storedKnowledge = localStorage.getItem('pubgKnowledgeBase');
    if (storedKnowledge) {
        knowledgeBase = storedKnowledge;
    }

    if (knowledgeBase) {
        instruction += `\n\nStrictly adhere to the following information as your primary knowledge base. Do not use outside information unless the user's query cannot be answered by this data:\n${knowledgeBase}`;
    }
    return instruction;
};

export const startNewChat = () => {
    chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: getSystemInstruction(),
        }
    });
};

export const getAiResponse = async (message: string): Promise<string> => {
    if (!chat) {
        startNewChat();
    }
    
    try {
        const result = await chat.sendMessage({ message });
        return result.text;
    } catch (error) {
        console.error("Error sending message to AI:", error);
        return "Sorry, I encountered a critical error. My systems are down. Please try again later.";
    }
};

export const updateKnowledgeBase = (jsonContent: string) => {
    // A more lenient JSON parsing approach.
    // 1. Strip comments (// and /* */) which are not valid in standard JSON.
    let processedContent = jsonContent.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
    // 2. Remove trailing commas from arrays and objects.
    processedContent = processedContent.replace(/,(?=\s*[}\]])/g, '');

    try {
        // Stage 1: Attempt to parse as a single, standard JSON object/array.
        const parsed = JSON.parse(processedContent);
        knowledgeBase = JSON.stringify(parsed, null, 2);
    } catch (error) {
        // If it's not the specific error for multiple JSON objects, re-throw a formatted error.
        if (!(error instanceof SyntaxError) || !error.message.includes('Unexpected non-whitespace character after JSON')) {
            console.error("Failed to parse standard JSON:", error);
            const detailedError = error instanceof Error ? error.message : "An unknown parsing error occurred.";
            throw new Error(`Invalid JSON: ${detailedError}. Please check your file.`);
        }

        // Stage 2: If the specific error occurred, it might be JSON Lines format (multiple objects).
        // Attempt to parse it line by line.
        try {
            const lines = processedContent.split('\n').filter(line => line.trim() !== '');
            if(lines.length === 0) throw new Error("File is empty after processing.");

            const parsedObjects = lines.map((line, index) => {
                try {
                    return JSON.parse(line);
                } catch (lineError) {
                    throw new Error(`Error on line ${index + 1}: ${(lineError as Error).message}`);
                }
            });
            // Store the collection of objects as a single JSON array.
            knowledgeBase = JSON.stringify(parsedObjects, null, 2);
        } catch (jsonLinesError) {
            console.error("Failed to parse as JSON Lines:", jsonLinesError);
            const detailedError = jsonLinesError instanceof Error ? jsonLinesError.message : "An unknown parsing error occurred.";
            throw new Error(`Invalid JSON Lines format: ${detailedError}. Please check your file.`);
        }
    }
    
    // If we reach here, one of the parsing methods was successful.
    localStorage.setItem('pubgKnowledgeBase', knowledgeBase);
    startNewChat();
};

startNewChat();