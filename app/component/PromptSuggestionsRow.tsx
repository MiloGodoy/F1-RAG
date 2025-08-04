import PromptSuggestionBotton from "./PromptSuggestionBotton"

const PromptSuggestionsRow = ({ onPromptClick }) => {
    const prompts = [
        "¡Quién es el piloto principal del Team Ferrari?",
        "Quién es el piloto mejor pagado de la Fórmula 1?",
        "¿Quien será el nuevo piloto de Mercedes?",
        "¿Quién es el actual piloto campeón mundial de Fórmula 1?"
    ]
    return (
        <div className="prompt-suggestion-row">
            {prompts.map((prompt, index) => 
            <PromptSuggestionBotton 
                key={`suggestion-${index}`}
                text={prompt}
                onClick={() => onPromptClick(prompt)}
            />)}
        </div>
    )
}

export default PromptSuggestionsRow