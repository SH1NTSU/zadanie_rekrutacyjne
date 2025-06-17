import axios from "axios"
import { createContext, useState, type ReactNode } from "react"

type AppContextType = {
	CSV: File | null,
	layout: File | null,
	setCSV: (csvFile: File) => void,
	setLayout: (layout: File) => void,
	send: () => Promise<void>,
}

const AppContext = createContext<AppContextType | undefined>(undefined);


export const AppProvider = ({children}: {children: ReactNode}) => {
	const [CSV, setCSV] = useState<File | null>(null);
	const [layout, setLayout] = useState<File | null>(null);
	

	const send = async () => {
	  const formData = new FormData();
	  formData.append("csv", CSV);
	  formData.append("layout", layout);

	  try {
	    await axios.post("http://localhost:8000/api/v1/generate", formData, {
	      headers: {
		"Content-Type": "multipart/form-data"
	      }
	    });
	    console.log("Post sent successfully!");
	  } catch (error) {
	    console.error(error);
	  }
	};

	return (
		<AppContext.Provider value={{CSV, layout, setCSV, setLayout, send}}>
			{children}
		</AppContext.Provider>
	);
};

export default AppContext;
