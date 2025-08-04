import { DataAPIClient } from "@datastax/astra-db-ts";
import puppeteer from "puppeteer";
import OpenAI from "openai";

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

import 'dotenv/config'

type SimilarityMetric = 'dot_product' | 'cosine' | 'euclidean'

const {
    ASTRA_DB_NAMESPACE,
    ASTRA_DB_COLLECTION,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_APPLICATION_TOKEN,
    OPENAI_API_KEY
} = process.env

const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

const f1Data = [
    'https://es.wikipedia.org/wiki/F%C3%B3rmula_1',
    'https://www.mundodeportivo.com/us/mas-deporte/20240319/682504/lewis-hamilton-revelan-verdadera-razon-cambio-mercedes-ferrari.html',
    'https://www.formula1.com/en/latest',
    'https://forbes.es/forbes-ricos/566997/los-pilotos-de-f-1-mejor-pagados-de-2024/',
    'https://es.wikipedia.org/wiki/Temporada_2024_de_F%C3%B3rmula_1',
]

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
const db = client.db(ASTRA_DB_API_ENDPOINT, { keyspace: ASTRA_DB_NAMESPACE})

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 512,
    chunkOverlap: 100
})

const createCollection = async (similarityMetric: SimilarityMetric = "dot_product") => {
    const res = await db.createCollection(ASTRA_DB_COLLECTION, {
        vector: {
            dimension: 1536,
            metric: similarityMetric
        }
    })
    console.log(res)
}

const loadSampleData = async () => {
    const collection = await db.collection(ASTRA_DB_COLLECTION)
    for await (const url of f1Data) {
        const content = await scrapePage(url)
        const chunks = await splitter.splitText(content)
        for await ( const chunk of chunks ) {
            const embedding = await openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: chunk,
                encoding_format: 'float'
            })

            const vector = embedding.data[0].embedding

            const res = await collection.insertOne({
                $vector: vector,
                text: chunk
            })
            console.log(res)
        }
    }
}

const scrapePage = async (url: string): Promise<string> => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: "domcontentloaded" });

    const html = await page.evaluate(() => document.body.innerHTML);

    await browser.close();
    return html.replace(/<[^>]*>?/gm, '');
}


createCollection().then(() => loadSampleData()) 