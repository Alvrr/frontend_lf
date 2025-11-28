let selectedLat = null;
let selectedLng = null;
let tempMarker = null;

// INIT MAP
const map = L.map("map").setView([-6.9175, 107.6191], 12);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
}).addTo(map);

// Klik pada map → simpan koordinat
map.on("click", function (e) {
  selectedLat = e.latlng.lat;
  selectedLng = e.latlng.lng;

  if (tempMarker) map.removeLayer(tempMarker);

  tempMarker = L.marker([selectedLat, selectedLng]).addTo(map);
});

// Load marker dari database
async function loadMarkers() {
  const res = await fetch("http://localhost:5000/api/markers");
  const data = await res.json();

  data.forEach((m) => {
    L.marker([m.lat, m.lng])
      .addTo(map)
      .bindPopup(`<b>${m.category}</b><br>${m.note}`);
  });
}
loadMarkers();

// Simpan marker
document.getElementById("saveBtn").addEventListener("click", async () => {
  const category = document.getElementById("category").value;
  const note = document.getElementById("note").value;

  if (!selectedLat || !selectedLng) {
    alert("Klik lokasi di map dulu brok!");
    return;
  }
  if (!category) {
    alert("Pilih kategori!");
    return;
  }
  if (!note) {
    alert("Isi catatan!");
    return;
  }

  const payload = {
    category,
    note,
    lat: selectedLat,
    lng: selectedLng,
  };

  const res = await fetch("http://localhost:5000/api/markers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  await res.json();

  alert("Marker berhasil disimpan!");

  selectedLat = null;
  selectedLng = null;
  document.getElementById("category").value = "";
  document.getElementById("note").value = "";

  map.removeLayer(tempMarker);
  loadMarkers();
});
