document.addEventListener('DOMContentLoaded', () => {
    const imageLoader = document.getElementById('imageLoader');
    const heatmapContainer = document.getElementById('heatmapContainer');
    const controls = document.getElementById('controls');
    const simulateBtn = document.getElementById('simulateBtn');
    let heatmapInstance;
    let currentFilename;

    imageLoader.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) {
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        fetch('http://127.0.0.1:5000/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(`Error: ${data.error}`);
                heatmapContainer.innerHTML = '';
                controls.style.display = 'none';
                return;
            }

            currentFilename = data.filename;
            heatmapContainer.innerHTML = `<img src="http://127.0.0.1:5000/uploads/${data.filename}" />`;

            const img = heatmapContainer.querySelector('img');
            img.onload = () => {
                heatmapContainer.style.width = `${img.width}px`;
                heatmapContainer.style.height = `${img.height}px`;

                heatmapInstance = h337.create({
                    container: heatmapContainer,
                    // Set the canvas size to the fixed simulation size for correct scaling
                    width: 800,
                    height: 600
                });

                // Show the simulation button
                controls.style.display = 'block';
            }
            img.onerror = () => {
                alert('Error: Failed to load image. The file may be corrupt or not a valid image.');
                heatmapContainer.innerHTML = '';
                controls.style.display = 'none';
            };
        })
        .catch(error => {
            console.error('Error uploading image:', error)
            alert('An unexpected error occurred during upload. See console for details.');
        });
    });

    simulateBtn.addEventListener('click', () => {
        if (!currentFilename) return;

        // Disable button to prevent multiple clicks
        simulateBtn.disabled = true;
        simulateBtn.textContent = 'Simulating...';

        fetch(`http://127.0.0.1:5000/simulate_heatmap/${currentFilename}`, {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateHeatmap();
            } else {
                alert('An error occurred during the simulation.');
            }
        })
        .finally(() => {
            // Re-enable button
            simulateBtn.disabled = false;
            simulateBtn.textContent = 'Generate Simulated Heatmap';
        });
    });

    function updateHeatmap() {
        if (!currentFilename) return;

        fetch(`http://127.0.0.1:5000/heatmap/${currentFilename}`)
            .then(response => response.json())
            .then(data => {
                const max = Math.max(...data.map(d => d.value), 0);
                heatmapInstance.setData({
                    max: max,
                    data: data
                });
            });
    }
});