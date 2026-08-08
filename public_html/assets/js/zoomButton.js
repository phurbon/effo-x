document.addEventListener("DOMContentLoaded", function () {
    let zoomLevel = 1; // start at level 1
    const layout = document.querySelector(".layout");
    const zoomInButton = document.getElementById("zoomIn");
    const zoomOutButton = document.getElementById("zoomOut");

    function applyZoom() {
        if (zoomLevel === 1) {
            layout.style.gridTemplateColumns = "repeat(5, 1fr)";
            layout.style.gridAutoRows = "340px";
            zoomOutButton.style.display = "none"; // hide button
            zoomInButton.style.display = "flex"; // show button
        } else if (zoomLevel === 2) {
            layout.style.gridTemplateColumns = "repeat(3, 1fr)";
            layout.style.gridAutoRows = "340px";
            document.querySelectorAll(".unit").forEach(el => el.style.display = "flex");
            zoomOutButton.style.display = "flex"; // show button
            zoomInButton.style.display = "flex";  // show visible
        } else if (zoomLevel === 3) {
            layout.style.gridTemplateColumns = "repeat(1, 1fr)";
            layout.style.gridAutoRows = "100vh";
            layout.style.gap = "0";
            layout.style.margin = "0";
            layout.style.padding = "0";
            document.querySelectorAll(".info").forEach(el => el.style.display = "flex");
            document.querySelectorAll("img").forEach(img => img.style.width = "30%");
            zoomOutButton.style.display = "flex"; // show button
            zoomInButton.style.display = "none";   // hide at max zoom
        }
    }

    zoomInButton.addEventListener("click", function () {
        if (zoomLevel < 3) {
            zoomLevel++;
            applyZoom();
        }
    });

    zoomOutButton.addEventListener("click", function () {
        if (zoomLevel > 1) {
            zoomLevel--;
            applyZoom();
        }
    });
});
