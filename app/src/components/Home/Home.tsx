import Drop from "../Drop/Drop";
import Download from "../Download/Download";
import { useContext } from "react";
import AppContext from "../../context/AppContext";
import type { ReactElement } from "react";
import "./Home.scss";

const Home = (): ReactElement => {
	const { isReady } = useContext(AppContext)!;

	return (
		<>
			<header>
				<h1>PDF generator</h1>
			</header>
			<main>
				<section>
					<p>
						This PDF generator lets you easily create a custom PDF by uploading two files: a CSV file with your data, and a layout file that defines the PDF structure. Simply drag and drop each file into its respective section, then click the "Generate" button. Once the files are processed, your PDF will be ready to download.
					</p>
				</section>
				<section className="form_section">
					{isReady ? <Download /> : <Drop />}
				</section>
			</main>
		</>
	);
};

export default Home;
