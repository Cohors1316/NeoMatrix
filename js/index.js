window.onload = function () {
    //MARK: Update
    const version = "v7.3.0";
    var logging = false;

    //MARK: Options
    var options = {
        fpsInterval: calculateFpsInterval(24),
        trailLength: calculateTrailLength(0.86),
        ui_rain_dropCount: 1,
        ui_characters_customCharset: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ()._,-=+*/\\:;\'\"<>?!@#$%&^[]{}",
        ui_font_customFont: "monospace",
        ui_font_size: 15,
        codes: makeCodes("ALL YOUR CODEBASE ARE BELONG TO US,jetzig-framework,ziglang,zig,jetzig,zigtools,zls,karlseguin,jetquery,jetkv,jetcommon"),
        matrixColor: rgbToHue([229, 165, 10]),
        ui_color_highlightFirstCharacter: true,
        ui_logo_scale: 1,
        ui_logo_positionX: 0,
        ui_logo_positionY: 0,
    }

    window.addEventListener('resize', function () {
        updateCanvasSize();
        updateGrid();
        updateMask();
        updateFont();
        initialAnimation();
    }, false);

    //MARK: Variables
    let fonts = ["monospace", "consolas", "courier-bold", "neo-matrix"];
    var logo = null;
    var startTime, now, then, elapsed, letters, columns, rows, drops, staticChars;
    var frequencyArray, frequencyArrayLength = 128, column_frequency;
    var column_hue, row_hue;
    var font_offset_y, font_offset_x;
    var maskDom = document.getElementById("mask");
    var mask = maskDom.getContext("2d");
    var colorOverlayDom = document.getElementById("color-overlay");
    var colorOverlay = colorOverlayDom.getContext("2d");
    var neoMatrixDom = document.getElementById("neo-matrix");
    var neoMatrix = neoMatrixDom.getContext("2d");

    updateCanvasSize();
    updateCharSet();
    updateLogo();
    updateFont();
    initialAnimation();
    startAnimating();

    function updateCanvasSize() {
        neoMatrixDom.height = window.innerHeight;
        neoMatrixDom.width = window.innerWidth;
        maskDom.height = window.innerHeight;
        maskDom.width = window.innerWidth;
        colorOverlayDom.height = window.innerHeight;
        colorOverlayDom.width = window.innerWidth;
    }

    function updateLogo() {
        logo = new Image();
        logo.onload = updateMask;
	logo.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
	    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 153 140">
                <g fill="#f7a41d">
	            <g>
		        <polygon points="46,22 28,44 19,30"/>
		        <polygon points="46,22 33,33 28,44 22,44 22,95 31,95 20,100 12,117 0,117 0,22" shape-rendering="crispEdges"/>
		        <polygon points="31,95 12,117 4,106"/>
	            </g>
	            <g>
		        <polygon points="56,22 62,36 37,44"/>
		        <polygon points="56,22 111,22 111,44 37,44 56,32" shape-rendering="crispEdges"/>
		        <polygon points="116,95 97,117 90,104"/>
		        <polygon points="116,95 100,104 97,117 42,117 42,95" shape-rendering="crispEdges"/>
		        <polygon points="150,0 52,117 3,140 101,22"/>
	            </g>
	            <g>
		        <polygon points="141,22 140,40 122,45"/>
		        <polygon points="153,22 153,117 106,117 120,105 125,95 131,95 131,45 122,45 132,36 141,22" shape-rendering="crispEdges"/>
		        <polygon points="125,95 130,110 106,117"/>
	            </g>
                </g>
            </svg>
	`);
    }

    //MARK: Mask
    function updateMask() {
        clearStaticChars();

        mask.globalCompositeOperation = 'source-over';
        mask.clearRect(0, 0, neoMatrixDom.width, neoMatrixDom.height);
        mask.fillStyle = "rgba(0, 0, 0, " + options.trailLength + ")";
        mask.fillRect(0, 0, neoMatrixDom.width, neoMatrixDom.height);

        mask.globalCompositeOperation = 'destination-out';

        if (logo) {
            let logo_width = (neoMatrixDom.height / 2) * (logo.width / logo.height) * options.ui_logo_scale;
            let logo_height = (neoMatrixDom.height / 2) * options.ui_logo_scale;

            mask.drawImage(logo, neoMatrixDom.width / 2 - logo_width / 2 + options.ui_logo_positionX, neoMatrixDom.height / 2 - logo_height / 2 + options.ui_logo_positionY, logo_width, logo_height);

            colorOverlay.clearRect(0, 0, neoMatrixDom.width, neoMatrixDom.height);
            colorOverlay.drawImage(logo, neoMatrixDom.width / 2 - logo_width / 2 + options.ui_logo_positionX, neoMatrixDom.height / 2 - logo_height / 2 + options.ui_logo_positionY, logo_width, logo_height);
        }
    }

    function drawMask() {
        neoMatrix.globalCompositeOperation = 'source-over';
        neoMatrix.drawImage(maskDom, 0, 0);

        if (logo && options.ui_logo_preserveColor) {
            neoMatrix.globalCompositeOperation = 'source-atop';
            neoMatrix.drawImage(colorOverlayDom, 0, 0);
            neoMatrix.globalCompositeOperation = 'source-over';
        }
    }

    //MARK: Charset
    function updateCharSet() {
        letters = options.ui_characters_customCharset.split("");
    }

    //MARK: Font
    function updateFont() {
        var font_name;
        font_name = options.ui_font_customFont;

        neoMatrix.font = options.ui_font_size + "px " + font_name;
        font_offset_y = options.ui_font_size / 8;
        font_offset_x = options.ui_font_size / 16;

        updateGrid();
        updateMask();
    }

    //MARK: Grid
    function updateGrid() {
        columns = Math.floor(neoMatrixDom.width / options.ui_font_size);
        rows = Math.floor(neoMatrixDom.height / options.ui_font_size);
        column_hue = Math.floor(360 / columns);
        row_hue = Math.floor(360 / rows);
        column_frequency = frequencyArrayLength / (columns * 2);
        clearStaticChars();
    }

    function clearStaticChars() {
        staticChars = [];
        for (let i = 0; i < columns; i++) {
            staticChars[i] = [];
            for (let j = 0; j < rows; j++)
                staticChars[i][j] = null;
        }
    }

    function initialAnimation() {
        drops = [];
        for (var i = 0; i < columns; i++) {
            drops[i] = [];
            for (var j = 0; j < options.ui_rain_dropCount; j++)
                drops[i][j] = [rows + 1, 0, 0, "", 0];
        }
    }

    function startAnimating() {
        then = Date.now();
        startTime = then;
        loop();
    }

    function loop() {
        window.requestAnimationFrame(loop);
        now = Date.now();
        elapsed = now - then;
        if (elapsed > options.fpsInterval) {
            then = now - (elapsed % options.fpsInterval);
            drawMatrix();
        }
    }

    //MARK: Draw Matrix
    function drawMatrix() {
        drawMask();
        isSilent = true;

        for (var i = 0; i < drops.length; i++) {
            var probability = 0.975;
            var audio_lightness = 50;

            var newDrop = true;
            for (var j = 0; j < options.ui_rain_dropCount; j++) {
                var character = calculateCharacter(drops[i][j], i);
                var lightness = audio_lightness;

                if (drops[i][j][1] > 0)
                    lightness = 100;

                if (options.ui_color_highlightFirstCharacter) {
                    neoMatrix.clearRect(i * options.ui_font_size - font_offset_x, ((drops[i][j][0] - 2) * options.ui_font_size) + font_offset_y, options.ui_font_size, options.ui_font_size);

                    var tmp = drops[i][j][0] - 1;
                    neoMatrix.fillStyle = calculateColor(i, tmp, drops[i][j][4]);
                    neoMatrix.fillText(drops[i][j][3], i * options.ui_font_size, tmp * options.ui_font_size);

                    neoMatrix.fillStyle = "#FFF";
                }
                else
                    neoMatrix.fillStyle = calculateColor(i, drops[i][j][0], lightness);

                neoMatrix.clearRect(i * options.ui_font_size, ((drops[i][j][0] - 1) * options.ui_font_size) + font_offset_y, options.ui_font_size, options.ui_font_size);
                drops[i][j][3] = character, drops[i][j][4] = lightness;
                neoMatrix.fillText(character, i * options.ui_font_size, drops[i][j][0] * options.ui_font_size);

                if (drops[i][j][0] > rows && Math.random() > probability && newDrop) {
                    drops[i][j] = [0, 0, 0, "", 0];
                    newDrop = false;
                }

                drops[i][j][0]++;
            }
        }
    }

    //MARK: Calculate Character
    function calculateCharacter(dropItem, column) {
        if (staticChars[column][dropItem[0]])
            return staticChars[column][dropItem[0]];

        if (Math.random() > 0.995 && dropItem[1] == 0) {
            dropItem[1] = Math.floor(Math.random() * options.codes.length) + 1;
            dropItem[2] = dropItem[0];
        }

        if (dropItem[1] != 0) {
            var codeCharIndex = dropItem[0] - dropItem[2];
            if (codeCharIndex < options.codes[dropItem[1] - 1].length)
                return options.codes[dropItem[1] - 1][codeCharIndex];
            dropItem[1] = 0;
            dropItem[2] = 0;
        }

        return letters[Math.floor(Math.random() * letters.length)];
    }

    //MARK: Calculate Color
    function calculateColor(i, j, lightness) {
        var hue, offset = Math.floor(options.colorAnimationSpeed * then);
        hue = options.matrixColor;
        return "hsl(" + hue%360 + ", 100%, " + lightness + "%)";
    }

    function calculateFpsInterval(fps) {
        return 1000 / fps;
    }

    function calculateTrailLength(value) {
        return map(value, 0.0, 1.0, 0.35, 0.02);
    }

    function calculateColorAnimationSpeed(value) {
        return map(value, -1, 1, 0.05, -0.05);
    }

    function makeCodes(codesText) {
        var codes = codesText.split(",");
        return codes;
    }
};

