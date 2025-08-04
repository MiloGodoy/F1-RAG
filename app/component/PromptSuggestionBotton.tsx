import React from 'react'

const PromptSuggestionBotton = ({ text, onClick}) => {
  return (
    <button
        className='prompt-suggestion-button'
        onClick={onClick}
    >
        {text}
    </button>
  )
}

export default PromptSuggestionBotton
