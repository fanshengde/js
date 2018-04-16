function main(){
	//start here
	const canvas = document.querySelector("#canvas");
	//canvas.width = 640;
	//canvas.height = 480;
	const gl = canvas.getContext("webgl");
	
	//If we don't have a GL context, give up now.
	if(!gl){
		alert('Unable to initialize WebGL. Your browser or machine may not support it.');
		return;
	}
	
	//Vertex shader program
	/*		着色器 （vsSource ）
	 *			顶点着色器
	 *每次渲染一个形状时，顶点着色器会在形状中的每个顶点运行。 它的工作是将输入顶点从原始坐标系转换到WebGL使用的缩放
	 *空间(clipspace)坐标系，其中每个轴的坐标范围从-1.0到1.0，并且不考虑纵横比，实际尺寸或任何其他因素。顶点着色器需
	 *要对顶点坐标进行必要的转换，在每个顶点基础上进行其他调整或计算，然后通过将其保存在由GLSL提供的特殊变量（我们称
	 *为gl_Position）中来返回变换后的顶点顶点着色器根据需要， 也可以完成其他工作。例如，决定哪个包含 texel面部纹理的
	 *坐标，可以应用于顶点；通过法线来确定应用到顶点的光照因子等。然后将这些信息存储在变量（varyings)或属性(attributes)
	 *属性中，以便与片段着色器共享以下的顶点着色器接收一个我们定义的属性（aVertexPosition）的顶点位置值。这个位置值是两个
	 *4x4矩阵uProjectionMatrix和uModelMatrix的乘积; gl_Position为结果值。有关投影和其他矩阵的更多信息，在这里（https://webglfundamentals.org/webgl/lessons/webgl-3d-perspective.html）
	 *您可能可以找到有帮助的文章.。
	 *
	 *		片段着色器（fsSource ）
	 *片段着色器在顶点着色器处理完图形的顶点后，会被要绘制的每个图形的每个像素点调用一次。它的职责是确定像素的颜色，通过
	 *指定应用到像素的纹理元素（也就是图形纹理中的像素），获取纹理元素的颜色，然后将应用适当的光照。之后颜色存储在特殊变量
	 *gl_FragColor中，返回到WebGL层。该颜色将最终绘制到屏幕上图形对应像素的对应位置。
	*/
	const vsSource = `
		attribute vec4 aVertexPosition;
		uniform mat4 uModelViewMatrix;
		uniform mat4 uProjectionMatrix;
		
		void main(){
			gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
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
		/*在创建着色器程序之后，
		 *我们需要查找WebGL返回分配的输入位置。
		 *在上述情况下，我们有一个属性和两个uniforms。
		 *属性从缓冲区接收值。顶点着色器的每次迭代都从分配给该属性的缓冲区接收下一个值。
		 *uniforms类似于JavaScript全局变量。它们在着色器的所有迭代中保持相同的值。
		 *由于属性和统一的位置是特定于单个着色器程序的，
		 *因此我们将它们存储在一起以使它们易于传递
		*/
		program : shaderProgram,
		attribLocations: {
			vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition')
		},
		uniformLocations : {
			projectionMatrix : gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
			modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix')
		}
	};
	
	
	//Here's where we call the routine that builds all the objects we'll be drawing
	const buffers = initBuffers(gl);
	
	
	//Draw the scene
	drawScene(gl, programInfo, buffers);
}


//initBuffers
//Initialize the buffers we'll need. for this demo , we just have one object
//a simple two-dimensional square.

function initBuffers(gl){
	/*		创建对象
	 *在画正方形前，
	 *我们需要创建一个缓冲器来存储它的顶点。
	 *我们会用到名字为 initBuffers() 的函数。
	 *当我们了解到更多WebGL 的高级概念时，
	 *这段代码会将有更多参数，变得更加复杂，并且用来创建更多的三维物体。
	 *
	 *
	 *这段代码简单给出了绘画场景的本质。
	 *首先，它调用 gl 的成员函数 createBuffer() 得到了缓冲对象并存储在顶点缓冲器。
	 *然后调用 bindBuffer() 函数绑定上下文。
	 *当上一步完成，我们创建一个Javascript 数组去记录每一个正方体的每一个顶点。
	 *然后将其转化为 WebGL 浮点型类型的数组，
	 *并将其传到 gl 对象的  bufferData() 方法来建立对象的顶点
	*/
	//Create a buffer for the square's positions.
	const positionBuffer = gl.createBuffer();
	
	//Select the positionBuffer as the one to apply buffer operations to from her out.
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	
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
	
	return {
		position: positionBuffer
	};
}

//draw the scene
function drawScene(gl, programInfo, buffers){
	
	/* 当着色器和物体都创建好后，我们可以开始渲染这个场景了。
	 * 因为我们这个例子不会产生动画，所以 drawScene() 方法非常简单。
	 * 它还使用了几个工具函数，稍后我们会介绍。
	 *
	 * 第一步，用背景色擦除上下文，接着建立摄像机透视矩阵。
	 * 			设置45度的视图角度，并且宽高比设为 640/480（画布尺寸）。
	 * 			指定在摄像机距离0.1到100单位长度的范围内，物体可见。
	 *
	 * 接着加载特定位置，并把正方形放在距离摄像机6个单位的的位置。
	 * 然后，我们绑定正方形的顶点缓冲到上下文，
	 * 并配置好，再通过调用 drawArrays() 方法来画出对象。 
	*/
	gl.clearColor(0.0, 0.0, 0.0, 1.0); //Clear to black, fully opaque
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
	const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
	const zNear = 0.1;
	const zFar = 100.0;
	const projectionMatrix = mat4.create();
	
	//note:glmatrix.js always has the first argument as the destination to receive the result.
	mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
	
	
	//Set the drawing position to the 'identity' point, which is the center of the scene.
	const modelViewMatrix = mat4.create();
	
	//Now move the drawing postion a bit to where we wan to start drawing the squarre
	
	mat4.translate(modelViewMatrix, //destination matrix
				   modelViewMatrix, //matrix to translate
				   [-0.0, 0.0, -6.0]); //amount to translate
	
	
	//Tell WebGL how to pull out the positons form the position buffer into the vertexPostion attribute;
	{
		const numComponents = 2;
		const type = gl.FLOAT;
		const normalize = false;
		const stride = 0;
		const offset = 0;
		gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
		gl.vertexAttribPointer(
							   programInfo.attribLocations.vertexPosition,
							   numComponents,
							   type,
							   normalize,
							   stride,
							   offset
							   );
		gl.enableVertexAttribArray(
								   programInfo.attribLocations.vertexPosition
								   );
	}
		//Tell Webgl to use our program when drawing
		gl.useProgram(programInfo.program);
	
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
	if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)){
		alert('Unable to initialize the shader program ' + gl.getProgramInfoLog(shaderProgram));
		return null;
	}
	
	return shaderProgram;
}

//creates a shader of the given type, uploads the source and compiles it.
function loadShader(gl, type, source){
	/*
	 *loadShader函数将WebGL上下文，着色器类型和源码作为参数输入，
	 *然后按如下步骤创建和编译着色器：
	 *
	 *
	 *1. 调用gl.createShader().创建一个新的着色器。
	 *
	 *2. 调用gl.shaderSource().将源代码发送到着色器。
	 *
	 *3. 一旦着色器获取到源代码，就使用gl.compileShader().进行编译。
	 *
	 *4. 为了检查是否成功编译了着色器，将检查着色器参数gl.COMPILE_STATUS状态。通过调用gl.
	 *
	 *5. 如果着色器被加载并成功编译，则返回编译的着色器。
	 *
	 *我们可以像这样调用这段代码
	 *
	 *const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
	*/
	
	const shader = gl.createShader(type);
	
	//send the source to the shader object.
	gl.shaderSource(shader, source);
	
	//Compile the shader progam
	gl.compileShader(shader);
	
	//See if it compiled successfully
	if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
		alert("An error occcurred compiling the shaders: " + gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		return null;
	}
	return shader;
	
}