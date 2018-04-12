function main(){
	//start here
	const canvas = document.querySelector("#canvas");
	
	const gl = canvas.getContext("webgl");
	
	//If we don't have a GL context, give up now.
	if(!gl){
		alert('Unable to initialize WebGL. Your browser or machine may not support it.');
		return;
	}
	
	//Vertex shader program
	const vsSource = `
		attribute vec4 aVertexPosition;
		uniform mat4 uModelViewMatrix;
		uniform mat4 uProjectionMatrix;
		
		void main(){
			gl_Postion = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
		}
	`;

	//Fragment shader program
	const fsSource = `
		void main(){
			gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
		}
	`;
	
	//Initialize a shader program; this is where the lighting
	//for the vertices and so forth is established.
	const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
	
	
	//Collect all the info needed to use the shader program.
	//Look up which attributre our shader program is using
	//for aVertexPosition and look up uniform locations.
	const programInfo = {
		program : shaderProgram,
		attribLocations: {
			vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition')
		},
		uniformLocations : {
			projectionMatrix : gl.getUniformLocation(shadeProgram, 'uProjectionMatrix'),
			modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix')
		}
	};
	
	
	//Here's where we call the routine that builds all the objects we'll be drawing
	const buffers = initBuffers(gl);
	
	
	//Draw the scene
	drawScene(gl, programInfo, buffers);
}


//initFuffers
//Initialize the buffers we'll need. for this demo , we just have one object
//a simple two-dimensional square.

function initBuffers(gl){
	//Create a buffer for the square's positions.
	const positionBuffer = gl.createBuffer();
	
	//Select the positionBuffer as the one to apply buffer operations to from her out.
	gl.bindBuffer(gl.ARRAY_BUFFER.positionBuffer);
	
	//Now create an array of positions for the square
	const positions = [
		1.0, 1.0,
		-1.0, 1.0,
		1.0, -1.0,
		-1.0, -1.0,
	];
	
	//Now pass the list of positions info WEBGL to build the shape.
	//WE do this by creating a Float32Array form the javaScript array, then use it to fill
	//the current buffer.
	gl.bufferData(gl.ARRAY_BUFFER,
				  new Float32Array(positions),
				  gl.STATIC_DRAW);
	
	return {position: positionBuffer};
}

//draw the scene
function drawScene(gl, programInfo, buffers){
	gl.clearColor(0.0, 0.0, 0.0, 1.0); //Clear to black, fully apaque
	gl.clearDepth(1.0); //clear everything
	gl.enable(gl.DEPTH_TEST); //enable depth testing.
	gl.depthFunc(gl.LEQUAL); //Near things obscure far things
	
	//Clear the canvas before we start drawing on it.
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	//Create a perspective marix, a special matrix that is used to simulate the distortion
	//of perspective in a camera。 Our field of view is 45 degrees, with a width/height
	//ratio that matches the display size of the canvas and we only want to see objects
	//between 0.1 units and 100 units away from the camera.
	const fieldOfView = 45 * Math.PI / 180;  //in radians.
	const aspect = gl.canvas.clienWidth / gl.canvas.clientHeight;
	const zNear = 0.1;
	const zFar = 100.0;
	const projectionMatrix = mat4.create();
	
	//note:glmatrix.js always has the first argument as the destination to receive the result.
	mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
	
	
	//Set the drawing position to the 'identity' point, which is the center of the scene.
	const modelViewMatrix = mat4.create();
	
	//Now move the drawing postion a bit to where we wan to start drawing the squarre
	
	mar4.translate(modelViewMatrix, //destination matrix
				   modelViewMatrix, //matrix to translate
				   [-0.0, 0.0, -6.0]); //amount to translate
	
	
	//Tell WebGL how to pull out the positons form the position buffer into the vertexPostion attribute;
	{
		const numComponents = 2;
		const type = gl.FLOAT;
		const normalize = false
		const stride = 0;
		const offset = 0;
		gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
		gl.vertexAttribPointer(
							   programInfo.attribLocations.vertexPosition,
							   numComponents,
							   type,
							   mormalize,
							   stride,
							   offset
							   );
		gl.enableVertexAttribArray(
								   programInfo.attribLocations.vertexPosition
								   );
		
		//Tell Webgl to use our program when drawing
		gl.useProgram(programInfo.program);
	}
	
	//Set the shader uniforms
	gl.uniformMatrix4fv(
						programInfo.uniformLocations.projectionMatrix,
						false,
						projectionMatrix
						);
	
	gl.uniformMatrix4fv(
						programInfo.uniformLocations.modelViewMatrix,
						false,
						modelViewMatrix
						);
	
	{
		const offset = 0;
		const vertexCount = 4;
		gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
	}
}

	
	
	//Initialize a shader program, so WEBGL knows how to draw our data
function initShaderProgram(gl, vsSource, fsSource){
	const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
	const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
	
	//Create the shader program.
	const shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);
	
	//If creating the shader program failed alert.
	if(gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)){
		alert('Unable to initialize the shader program ' + gl.getProgramInfoLog(shaderProgram));
		return null;
	}
	
	return shaderProgram;
}

//creates a shader of the given type, uploads the source and compiles it.
function loadShader(gl, type, source){
	const shader = gl.createShader(type);
	
	//send the source to the shader object.
	
	gl.shaderSource(shader, source);
	
	//Compile the shader progam
	gl.compileShader(shader);
	
	//See if it compiled successfully
	
	if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
		alert("An error occcurred compiling the shaders: " + gl.getShaderInfoLog(shader));
		return null;
	}
	return shader;
	
}