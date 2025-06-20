import axios from "axios";
import { createContext, useState, type ReactNode } from "react";

type AppContextType = {
    CSV: File | null,
    layout: File | null,
    setCSV: (csvFile: File) => void,
    setLayout: (layout: File) => void,
    send: () => Promise<void>,
    progress: number,
    isGenerating: boolean,
    isReady: boolean,
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [CSV, setCSV] = useState<File | null>(null);
    const [layout, setLayout] = useState<File | null>(null);

    const [progress, setProgress] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isReady, setIsReady] = useState(false);

const send = async () => {
    const formData = new FormData();
    if (CSV) formData.append("csv", CSV);
    if (layout) formData.append("layout", layout);

    setIsGenerating(true);
    setIsReady(false);
    setProgress(0);

    try {
        const response = await axios.post("http://localhost:8000/api/v1/generate", formData, {
            headers: { "Content-Type": "multipart/form-data" },
            responseType: 'blob',
            onUploadProgress: (event) => {
                if (event.total) {
                    const percent = Math.round((event.loaded * 100) / event.total);
                    setProgress(percent);
                }
            }
        });

        console.log("Post sent successfully!");

        if (response.status === 200 && response.data.size > 0) {
            makeDownload(response);
        } else {
            console.error("Invalid PDF file received from server.");
        }

        setIsGenerating(false);
        setIsReady(true);
    } catch (error) {
        console.error("Error during PDF generation or download:", error);
        setIsGenerating(false);
    }
};
    return (
        <AppContext.Provider value={{
            CSV, layout, setCSV, setLayout,
            send, progress, isGenerating, isReady
        }}>
            {children}
        </AppContext.Provider>
    );
};

const makeDownload = (response: any) => {
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'generated_pdf.pdf';

    if (contentDisposition && contentDisposition.includes('filename=')) {
        const filenameMatch = /filename\*?=['"]?(?:UTF-8''|[^; ]+)?([^"';\n]*)/.exec(contentDisposition);
        if (filenameMatch && filenameMatch[1]) {
            filename = decodeURIComponent(filenameMatch[1].replace(/['"]/g, ''));
        }
    }

    const pdfBlob = new Blob([response.data], { type: 'application/pdf' });

    const blobUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);

    console.log(`DEBUG: Triggered download for ${filename}`);
};
export default AppContext;
