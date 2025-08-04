import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from 'ai'
// import { createStreamableValue } from 'ai'
import { DataAPIClient } from "@datastax/astra-db-ts";

const {
    ASTRA_DB_NAMESPACE,
    ASTRA_DB_COLLECTION,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_APPLICATION_TOKEN,
    OPENAI_API_KEY
} = process.env

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY
})

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
const db = client.db(ASTRA_DB_API_ENDPOINT, { keyspace: ASTRA_DB_NAMESPACE })

export async function POST(req: Request) {
    try {
        const { messages } = await req.json()
        const latestMessage = messages[messages?.length - 1]?.content

        let docContext = ""

        const embedding = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: latestMessage,
            encoding_format: 'float'
        })

        try {
            const collection = await db.collection(ASTRA_DB_COLLECTION)
            const cursor = collection.find(null, {
                sort: {
                    $vector: embedding.data[0].embedding,
                },
                limit: 10
            })

            const documents = await cursor.toArray()

            const docsMap = documents?.map(doc => doc.text)

            docContext = JSON.stringify(docsMap)

        } catch (err) {
            console.log("Error querying db...")
            docContext = ""
        } 

        const template = {
            role: "system",
            content: `
                Eres un asistente de IA que sabe todo sobre Fórmula Uno. Usa el contexto que te paso
                abajo para aumentar lo que ya sabes. El contexto será proveído de las publicaciones 
                más recientes de Wikipedia, la página oficial de la Fórmula Uno y otras.
                Si el contexto no incluye la información que necesitas, responde con tu conocimiento
                existente y no menciones cual información está incluida en el contexto y cual no.
                Solo responde en texto
                -------------------------
                START CONTEXT
                ${docContext}
                END CONTEXT
                --------------------------
                QUESTION: ${latestMessage}
                --------------------------
            `
        }
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            stream: true,
            messages: [template, ...messages]
        })

        const stream = OpenAIStream(response)
        return new StreamingTextResponse(stream)
    } catch (err) {
        throw err
    }
}