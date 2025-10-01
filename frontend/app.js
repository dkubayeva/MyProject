document.addEventListener('DOMContentLoaded', () => {
    const imageLoader = document.getElementById('imageLoader');
    const heatmapContainer = document.getElementById('heatmapContainer');
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
                return;
            }

            currentFilename = data.filename;
            heatmapContainer.innerHTML = `<img src="http://127.0.0.1:5000/uploads/${data.filename}" />`;

            const img = heatmapContainer.querySelector('img');
            img.onload = () => {
                heatmapContainer.style.width = `${img.width}px`;
                heatmapContainer.style.height = `${img.height}px`;

                heatmapInstance = h337.create({
                    container: heatmapContainer
                });

                heatmapContainer.onclick = (ev) => {
                    const rect = heatmapContainer.getBoundingClientRect();
                    const x = ev.clientX - rect.left;
                    const y = ev.clientY - rect.top;
                    const dataPoint = { x: Math.round(x), y: Math.round(y), value: 1 };

                    fetch(`http://127.0.0.1:5000/heatmap/${currentFilename}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(dataPoint)
                    })
                    .then(() => {
                        updateHeatmap();
                    });
                };
                updateHeatmap();
            }
            img.onerror = () => {
                alert('Error: Failed to load image. The file may be corrupt or not a valid image.');
                heatmapContainer.innerHTML = '';
            };
        })
        .catch(error => {
            console.error('Error uploading image:', error)
            alert('An unexpected error occurred during upload. See console for details.');
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