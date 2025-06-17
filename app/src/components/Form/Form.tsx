// Form.tsx
import type { ReactElement } from "react";
import Drop from "../Drop/Drop.tsx";
import { useContext } from "react";
import AppContext from "../../context/FormContext.tsx";

const Form = (): ReactElement => { 
	const {CSV, layout, setCSV, setLayout, send} = useContext(AppContext);
	
	const handleSubmit = (e: React.FormEvent) => { 
		e.preventDefault();
		send();
	}

	return (
		<>
		<header>
		    <h1>PDF generator</h1>
		</header>
		<main>
		   <section>
		   <p></p>
		   </section>
		   <section>
		    <form onSubmit={handleSubmit}>
		    	<Drop setLayout={setLayout} setCSV={setCSV} />
			<button>Generate</button>    	
		    </form>
		   </section>
		</main>
		</>
	);
};

export default Form;
