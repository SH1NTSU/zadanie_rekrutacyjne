import React, { useCallback, useContext, type ReactElement } from "react";

interface DropProps {
  setCSV: (file: File) => void;
  setLayout: (file: File) => void;
}

const Drop = ({ setCSV, setLayout }: DropProps): ReactElement => {  
	const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();

	}, []);
	const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
	  e.preventDefault();
	  const files = e.dataTransfer.files;
	  if (!files || files.length === 0) return;

	  const file = files[0]; 	  
	  const sectionType = e.currentTarget.getAttribute("data-type");

	  if (sectionType === "csv") {
	    setCSV(file);
	  } else if (sectionType === "layout") {
	    setLayout(file);
	  }
	}, [setCSV, setLayout]);
	
	

	return (
		<div>
		<section className="CSV" data-type="csv" onDragOver={handleDragOver} onDrop={handleDrop}>
			<p>Drop CSV</p>
		</section>
		<section className="layout" data-type="layout" onDragOver={handleDragOver} onDrop={handleDrop}>
			<p>Drop Layout </p>
		</section>
		</div>
	)
}

export default Drop;
