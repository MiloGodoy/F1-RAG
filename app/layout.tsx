import './global.css'

export const metadata = {
    title: 'F1-RAG',
    description: "El lugar donde encuenstras la información más completa acerca de la Fórmula Uno"
}

const RootLayout = ({ children }) => {
    return (
        <html lang='es'>
            <body>{children}</body>
        </html>
    )
}

export default RootLayout