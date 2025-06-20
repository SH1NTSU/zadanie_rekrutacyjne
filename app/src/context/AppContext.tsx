import axios from "axios"
import { createContext, useState, type ReactNode } from "react"

type AppContextType = {
	CSV: File | null,
	layout: File | null,
	setCSV: (csvFile: File) => void,
	setLayout: (layout: File) => void,
	send: () => Promise<void>,
	progress: number,
	isGenerating: boolean,
	isReady: boolean,
	url: any;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
	const [CSV, setCSV] = useState<File | null>(null);
	const [layout, setLayout] = useState<File | null>(null);

	const [progress, setProgress] = useState(0);
	const [isGenerating, setIsGenerating] = useState(false);
	const [isReady, setIsReady] = useState(false);
	const [url, setUrl] = useState("");
	const send = async () => {

		const formData = new FormData();
		formData.append("csv", CSV);
		formData.append("layout", layout);

		setIsGenerating(true);
		setIsReady(false);
		setProgress(0);

		try {
			const response = await axios.post("http://localhost:8000/api/v1/generate", formData, {
				headers: { "Content-Type": "multipart/form-data" },
				onUploadProgress: (event) => {
					if (event.total) {
						const percent = Math.round((event.loaded * 100) / event.total);
						setProgress(percent);
					}
				}
			});

			console.log("Post sent successfully!");
			setProgress(100);
			
			const blobUrl = makeDownload(response);
			
			setUrl(blobUrl);
			await new Promise(res => setTimeout(res, 500));

			setIsGenerating(false);
			setIsReady(true);
		} catch (error) {
			console.error(error);
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

const makeDownload = async (response: any) => {

	const contentDisposition = response.headers.get('Content-Disposition');
	let filename = 'generated_pdf.pdf'; // Default filename
	if (contentDisposition && contentDisposition.includes('filename=')) {
	    // Extract filename from header (careful with quotes)
	    const filenameMatch = /filename\*?=['"]?(?:UTF-8''|[^; ]+)?([^"';\n]*)/.exec(contentDisposition);
	    if (filenameMatch && filenameMatch[1]) {
		filename = decodeURIComponent(filenameMatch[1].replace(/['"]/g, ''));
	    }
	}

	// Get the response as a Blob (binary data)
	const pdfBlob = await response.blob();

	// Create a URL for the Blob
	const blobUrl = URL.createObjectURL(pdfBlob);

	return blobUrl;

}




export default AppContext;
