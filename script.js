let selectedLat = null;
let selectedLng = null;
let tempMarker = null;
let editingMarkerId = null;
let allMarkers = [];
let markerLayers = [];
let deleteMarkerId = null;

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
async function loadMarkers(filterCategory = 'all') {
  // Hapus semua marker yang ada
  markerLayers.forEach(marker => map.removeLayer(marker));
  markerLayers = [];

  const res = await fetch("http://localhost:5000/api/markers");
  const data = await res.json();
  allMarkers = data;

  // Filter berdasarkan kategori
  const filteredData = filterCategory === 'all' 
    ? data 
    : data.filter(m => m.category === filterCategory);

  filteredData.forEach((m) => {
    const marker = L.marker([m.lat, m.lng]).addTo(map);
    
    const popupContent = `
      <div style="min-width: 200px;">
        <b style="font-size: 1.1em; color: #26a69a;">${getCategoryIcon(m.category)} ${m.category.toUpperCase()}</b>
        <p style="margin: 8px 0;">${m.note}</p>
        <div class="popup-buttons">
          <button class="popup-btn btn-edit" data-id="${m._id}">✏️ Edit</button>
          <button class="popup-btn btn-delete" data-id="${m._id}">🗑️ Hapus</button>
        </div>
      </div>
    `;
    
    marker.bindPopup(popupContent);
    markerLayers.push(marker);
  });
}

function getCategoryIcon(category) {
  const icons = {
    'makanan': '🍔',
    'minuman': '☕',
    'kecelakaan': '⚠️',
    'favorit': '⭐',
    'lainnya': '📌'
  };
  return icons[category] || '📍';
}

// Event delegation untuk tombol edit dan delete di popup
map.on('popupopen', function(e) {
  const popup = e.popup;
  const content = popup.getElement();
  
  const editBtn = content.querySelector('.btn-edit');
  const deleteBtn = content.querySelector('.btn-delete');
  
  if (editBtn) {
    editBtn.addEventListener('click', function() {
      const id = this.getAttribute('data-id');
      editMarker(id);
    });
  }
  
  if (deleteBtn) {
    deleteBtn.addEventListener('click', function() {
      const id = this.getAttribute('data-id');
      confirmDelete(id);
    });
  }
});

loadMarkers();

// Simpan atau Update marker
document.getElementById("saveBtn").addEventListener("click", async () => {
  const category = document.getElementById("category").value;
  const note = document.getElementById("note").value;

  if (!editingMarkerId && (!selectedLat || !selectedLng)) {
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

  if (editingMarkerId) {
    // UPDATE
    const res = await fetch(`http://localhost:5000/api/markers/${editingMarkerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    await res.json();
    alert("Marker berhasil diupdate!");
    cancelEdit();
  } else {
    // CREATE
    const res = await fetch("http://localhost:5000/api/markers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    await res.json();
    alert("Marker berhasil disimpan!");
  }

  resetForm();
  const currentFilter = document.getElementById("filterCategory").value;
  loadMarkers(currentFilter);
});

// Edit marker
function editMarker(id) {
  const marker = allMarkers.find(m => m._id === id);
  if (!marker) return;

  editingMarkerId = id;
  selectedLat = marker.lat;
  selectedLng = marker.lng;

  document.getElementById("category").value = marker.category;
  document.getElementById("note").value = marker.note;
  document.getElementById("formTitle").textContent = "✏️ Edit Marker";
  document.getElementById("saveBtn").innerHTML = "<span>💾 Update Marker</span>";
  document.getElementById("cancelEditBtn").style.display = "block";

  // Tampilkan temporary marker
  if (tempMarker) map.removeLayer(tempMarker);
  tempMarker = L.marker([marker.lat, marker.lng]).addTo(map);
  map.setView([marker.lat, marker.lng], 15);

  // Scroll ke form
  document.querySelector(".form-card").scrollIntoView({ behavior: "smooth" });
}

// Batal edit
document.getElementById("cancelEditBtn").addEventListener("click", cancelEdit);

function cancelEdit() {
  editingMarkerId = null;
  resetForm();
  document.getElementById("formTitle").textContent = "✨ Tambah Marker Baru";
  document.getElementById("saveBtn").innerHTML = "<span>💾 Simpan Marker</span>";
  document.getElementById("cancelEditBtn").style.display = "none";
}

// Reset form
function resetForm() {
  selectedLat = null;
  selectedLng = null;
  document.getElementById("category").value = "";
  document.getElementById("note").value = "";
  if (tempMarker) map.removeLayer(tempMarker);
}

// Konfirmasi delete
function confirmDelete(id) {
  deleteMarkerId = id;
  document.getElementById("deleteModal").style.display = "block";
}

// Hapus marker
document.getElementById("confirmDeleteBtn").addEventListener("click", async () => {
  if (!deleteMarkerId) return;

  const res = await fetch(`http://localhost:5000/api/markers/${deleteMarkerId}`, {
    method: "DELETE",
  });

  await res.json();
  alert("Marker berhasil dihapus!");

  document.getElementById("deleteModal").style.display = "none";
  deleteMarkerId = null;

  const currentFilter = document.getElementById("filterCategory").value;
  loadMarkers(currentFilter);
});

// Batal delete
document.getElementById("cancelDeleteBtn").addEventListener("click", () => {
  document.getElementById("deleteModal").style.display = "none";
  deleteMarkerId = null;
});

// Filter kategori
document.getElementById("filterCategory").addEventListener("change", (e) => {
  loadMarkers(e.target.value);
});
