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
		formData.append("csv", CSV);
		formData.append("layout", layout);

		setIsGenerating(true);
		setIsReady(false);
		setProgress(0);

		try {
			await axios.post("http://localhost:8000/api/v1/generate", formData, {
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

export default AppContext;
