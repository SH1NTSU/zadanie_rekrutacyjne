import React, { useCallback, useContext, type ReactElement } from "react";
import { FileText, FileSpreadsheet } from "lucide-react";
import AppContext from "../../context/AppContext";
import "./Drop.scss";

const Drop = (): ReactElement => {
	const { CSV, layout, setCSV, setLayout, send, progress, isGenerating } = useContext(AppContext)!;

	const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
	}, []);

	const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		const files = e.dataTransfer.files;
		if (!files || files.length === 0) return;

		const file = files[0];
		const sectionType = e.currentTarget.getAttribute("data-type");

		if (sectionType === "csv") setCSV(file);
		else if (sectionType === "layout") setLayout(file);
	}, [setCSV, setLayout]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		send();
	};

	if (isGenerating) {
		return (
			<div className="progress-container">
				<p>Generating PDF... {progress}%</p>
				<div className="progress-bar">
					<div className="progress-fill" style={{ width: `${progress}%` }} />
				</div>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit}>
			<section>
				<div className="drop" data-type="csv" onDragOver={handleDragOver} onDrop={handleDrop}>
					<FileSpreadsheet size={18} style={{ marginRight: "0.5rem" }} />
					  {CSV ? "CSV Dropped" : "Drop CSV"}
				</div>
				<div className="drop" data-type="layout" onDragOver={handleDragOver} onDrop={handleDrop}>
					<p>
					  <FileText size={18} style={{ marginRight: "0.5rem" }} />
					  {layout ? "Layout Dropped" : "Drop Layout"}
					</p>
				</div>
			</section>
			<button type="submit">Generate</button>
		</form>
	);
};

export default Drop;
