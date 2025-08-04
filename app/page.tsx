'use client'

import Image from "next/image"
import F1_RAGLogo from './assets/F1_RAG.png'
import { useState, useEffect } from "react"
import Bubble from "./component/Bubble"
import LoadingBubble from "./component/LoadingBubble"
import PromptSuggestionsRow from "./component/PromptSuggestionsRow"

const Home = () => {
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const noMessages = !messages || messages.length === 0

    const handlePrompt = async (promptText) => {
        const msg = { id: crypto.randomUUID(), content: promptText, role: 'user' }
        setMessages((prev) => [...prev, msg])
        await sendMessage(promptText)
    }

    const handleInputChange = (e) => {
        setInput(e.target.value)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (input.trim()) {
            const msg = { id: crypto.randomUUID(), content: input, role: 'user' }
            setMessages((prev) => [...prev, msg])
            setInput("")
            await sendMessage(input)
        }
    }

    const sendMessage = async (content) => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [{ role: 'user', content }] }),
            })
            if (!response.ok) throw new Error('Network response was not ok')
            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let assistantMessage = { id: crypto.randomUUID(), content: '', role: 'assistant' }
            setMessages((prev) => [...prev, assistantMessage])

            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                const text = decoder.decode(value)
                assistantMessage.content += text
                setMessages((prev) => {
                    const newMessages = [...prev]
                    newMessages[newMessages.length - 1] = { ...assistantMessage }
                    return newMessages
                })
            }
        } catch (err) {
            console.error('Error sending message:', err)
            setMessages((prev) => [
                ...prev,
                { id: crypto.randomUUID(), content: 'Error: Unable to get response', role: 'assistant' }
            ])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <main>
            <Image src={F1_RAGLogo} width="250" alt="F1_RAG Logo" />
            <section className={noMessages ? "" : "populated"}>
                {noMessages ? (
                    <>
                        <p className="starter-text">
                            El mejor lugar para los fanáticos de la Fórmula 1.
                            Pregunta a F1RAG cualquier tema relacionado a las carreras de F1
                            y el te retornará la info más actualizada.
                            ¡Que lo disfrutes!
                        </p>
                        <PromptSuggestionsRow onPromptClick={handlePrompt} />
                    </>
                ) : (
                    <>
                        {messages.map((message, index) => 
                            <Bubble key={`message-${index}`} message={message} />
                        )}
                        {isLoading && <LoadingBubble />}
                    </>
                )}
            </section>
            <form onSubmit={handleSubmit}>
                <input 
                    className="question-box" 
                    onChange={handleInputChange} 
                    value={input} 
                    placeholder="pregúntame algo..." 
                />
                <input type="submit" />
            </form>
        </main>
    )
}

export default Home