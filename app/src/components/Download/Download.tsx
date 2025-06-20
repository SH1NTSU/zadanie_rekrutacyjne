import AppContext from "../../context/AppContext";
import "./Download.scss";
import { useContext, type ReactElement } from "react";

const Download = (): ReactElement => {
	const {url} = useContext(AppContext);
	

	const handleSubmit = () => {
	    const link = document.createElement('a');
	    link.href = url;
	    link.download = 'generated.pdf';
	    document.body.appendChild(link);
	    link.click();
	    link.remove();
	    URL.revokeObjectURL(url);
	}

	return (
		<>
		<div>
			<span>Your file is ready. Just hit the button bellow and it will download automaticly.</span>
			<button onClick={handleSubmit}>Download</button>
		</div>
		</>
	)
}


export default Download;
