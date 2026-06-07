// --- 1. SETUP INTI THREE.JS ---
const scene = new THREE.Scene();
// Warna langit biru cerah sesuai gambar referensi
scene.background = new THREE.Color(0x9cbce2); 

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
// Sudut pandang kamera dibuat agak rendah (low-angle) agar sensasi perspektif jalanan kota terasa nyata
camera.position.set(0, 12, 32); 
camera.lookAt(0, 2, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// --- 2. PENCAHAYAAN CERAH ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
sunLight.position.set(25, 40, 15);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.bias = -0.0005;
scene.add(sunLight);

// --- 3. LINGKUNGAN (RUMPUT & JALAN LEBAR) ---
const grassGeo = new THREE.PlaneGeometry(200, 200);
const grassMat = new THREE.MeshStandardMaterial({ color: 0x93c47d, roughness: 1.0 }); // Hijau terang sesuai gambar
const grass = new THREE.Mesh(grassGeo, grassMat);
grass.rotation.x = -Math.PI / 2;
grass.receiveShadow = true;
scene.add(grass);

const roadMat = new THREE.MeshStandardMaterial({ color: 0x3d4550, roughness: 0.8 }); // Aspal abu kebiruan
const roadH = new THREE.Mesh(new THREE.PlaneGeometry(200, 10), roadMat);
roadH.rotation.x = -Math.PI / 2;
roadH.position.y = 0.01;
roadH.receiveShadow = true;

const roadV = new THREE.Mesh(new THREE.PlaneGeometry(10, 200), roadMat);
roadV.rotation.x = -Math.PI / 2;
roadV.position.y = 0.01;
roadV.receiveShadow = true;
scene.add(roadH, roadV);

// --- 4. DEKORASI DETAIL (MARKA, ZEBRA CROSS, GEDUNG LATAR) ---
function createCityEnvironment() {
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.6 });
    const envGroup = new THREE.Group();

    // A. Zebra Cross di 4 Sisi Persimpangan
    const zebraPositions = [
        { x: 0, z: 8, rot: 0 },    // Sisi Bawah
        { x: 0, z: -8, rot: 0 },   // Sisi Atas
        { x: -8, z: 0, rot: Math.PI / 2 }, // Sisi Kiri
        { x: 8, z: 0, rot: Math.PI / 2 }   // Sisi Kanan
    ];

    zebraPositions.forEach(pos => {
        const zebraGroup = new THREE.Group();
        zebraGroup.position.set(pos.x, 0.02, pos.z);
        zebraGroup.rotation.y = pos.rot;
        // Membuat 7 balok putih berjejer untuk setiap zebra cross
        for (let i = -3.5; i <= 3.5; i += 1.1) {
            const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 3), whiteMat);
            stripe.rotation.x = -Math.PI / 2;
            stripe.position.x = i;
            zebraGroup.add(stripe);
        }
        envGroup.add(zebraGroup);
    });

    // B. Garis Marka Putih Tengah Jalan
    for (let i = -90; i <= 90; i += 8) {
        if (i >= -12 && i <= 12) continue; // Kosongkan bagian tengah persimpangan
        
        const mH = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.2), whiteMat);
        mH.rotation.x = -Math.PI / 2;
        mH.position.set(i, 0.02, 0);

        const mV = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 3), whiteMat);
        mV.rotation.x = -Math.PI / 2;
        mV.position.set(0, 0.02, i);

        envGroup.add(mH, mV);
    }

    // C. Garis Henti Kuning
    const stopLines = [
        { w: 5, h: 0.3, x: -8, z: 2.5, r: 0 },  // Kiri
        { w: 5, h: 0.3, x: 8, z: -2.5, r: 0 },  // Kanan
        { w: 0.3, h: 5, x: -2.5, z: -8, r: 0 }, // Atas
        { w: 0.3, h: 5, x: 2.5, z: 8, r: 0 }    // Bawah
    ];
    stopLines.forEach(s => {
        const line = new THREE.Mesh(new THREE.PlaneGeometry(s.w, s.h), yellowMat);
        line.rotation.x = -Math.PI / 2;
        line.position.set(s.x, 0.02, s.z);
        envGroup.add(line);
    });

    // D. Latar Belakang Gedung Perkotaan Silhouette (Gedung 3D Blok di Kejauhan)
    const buildingMat = new THREE.MeshStandardMaterial({ color: 0x7fa9cc, roughness: 1.0 }); // Biru muda pastel silhouette
    for (let i = 0; i < 25; i++) {
        const h = 15 + Math.random() * 25;
        const w = 6 + Math.random() * 6;
        const bMesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, 5), buildingMat);
        // Susun berderet di area belakang (Z = -70)
        bMesh.position.set(-80 + (i * 7), h / 2, -70);
        envGroup.add(bMesh);
    }

    scene.add(envGroup);
}
createCityEnvironment();

// --- 5. FUNGSI LAMPU JALAN & LAMPU LALU LINTAS 3 WARNA REALISTIS ---
function createModernTrafficLight(x, z, rotationY) {
    const tlGroup = new THREE.Group();
    tlGroup.position.set(x, 0, z);
    tlGroup.rotation.y = rotationY;

    const darkMat = new THREE.MeshStandardMaterial({ color: 0x2c3539, roughness: 0.5 }); // Besi abu gelap

    // Tiang Utama
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 6, 16), darkMat);
    pole.position.y = 3;
    pole.castShadow = true;
    tlGroup.add(pole);

    // Rumah Lampu Vertikal (Kotak Panjang)
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.8, 0.5), darkMat);
    box.position.set(0, 5.2, 0);
    box.castShadow = true;
    tlGroup.add(box);

    // 3 Buah Lensa Lampu (Merah, Kuning, Hijau)
    const lightGeo = new THREE.SphereGeometry(0.18, 16, 16);
    
    const rLight = new THREE.Mesh(lightGeo, new THREE.MeshStandardMaterial({ color: 0x330000, roughness: 0.2 })); // Merah Off
    rLight.position.set(0, 5.7, 0.26);
    
    const yLight = new THREE.Mesh(lightGeo, new THREE.MeshStandardMaterial({ color: 0x332200, roughness: 0.2 })); // Kuning Off
    yLight.position.set(0, 5.2, 0.26);
    
    const gLight = new THREE.Mesh(lightGeo, new THREE.MeshStandardMaterial({ color: 0x003300, roughness: 0.2 })); // Hijau Off
    gLight.position.set(0, 4.7, 0.26);

    // Beri nama khusus pada objek bola lampu agar sistem animasi & klik mendeteksinya
    rLight.name = "Lampu_Merah";
    yLight.name = "Lampu_Kuning";
    gLight.name = "Lampu_Hijau";

    tlGroup.add(rLight, yLight, gLight);

    // BONUS: Tiang Lampu Penerangan Jalan Melengkung (Sesuai Gambar)
    const streetLightGroup = new THREE.Group();
    // Tiang melengkung dibuat horizontal di atas tiang utama
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3, 12), darkMat);
    arm.rotation.z = Math.PI / 2;
    arm.position.set(1.5, 6, 0);
    streetLightGroup.add(arm);
    // Kap Lampu jalan putih di ujung tiang lengkung
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.15, 0.5), new THREE.MeshStandardMaterial({ color: 0xeeeeee }));
    cap.position.set(3, 6, 0);
    const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.4), new THREE.MeshBasicMaterial({ color: 0xfffee4 })); // Bohlam menyala kuning hangat
    bulb.position.set(3, 5.9, 0);
    streetLightGroup.add(cap, bulb);
    tlGroup.add(streetLightGroup);

    return { group: tlGroup, red: rLight, yellow: yLight, green: gLight };
}

// Menaruh 4 Set Lampu di seberang persimpangan menghadap mobil pengantre
const tlL = createModernTrafficLight(7, 7, -Math.PI / 2); // Mengontrol Sisi Kiri
const tlR = createModernTrafficLight(-7, -7, Math.PI / 2); // Mengontrol Sisi Kanan
const tlT = createModernTrafficLight(7, -7, Math.PI);      // Mengontrol Sisi Atas
const tlB = createModernTrafficLight(-7, 7, 0);            // Mengontrol Sisi Bawah

scene.add(tlL.group, tlR.group, tlT.group, tlB.group);

// --- 6. FUNGSI GENERATOR MOBIL BAGUS ---
function createCar(colorHex, carName) {
    const carGroup = new THREE.Group();
    carGroup.name = carName;

    const bodyMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.2, metalness: 0.4 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.1 });

    // Sasis Utama
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.6, 1.2), bodyMat);
    body.position.y = 0.5;
    body.castShadow = true;
    carGroup.add(body);

    // Kabin Atap
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.55, 1.1), bodyMat);
    cabin.position.set(-0.1, 1.05, 0);
    cabin.castShadow = true;
    carGroup.add(cabin);

    // Kaca Jendela Gelap
    const glass = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.38, 1.12), glassMat);
    glass.position.set(-0.1, 1.06, 0);
    carGroup.add(glass);

    // Roda
    const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.25, 24);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
    const carWheels = [];
    const wheelOffsets = [
        [-0.7, 0.3, 0.6], [0.7, 0.3, 0.6],
        [-0.7, 0.3, -0.6], [0.7, 0.3, -0.6]
    ];
    wheelOffsets.forEach(pos => {
        const wMesh = new THREE.Mesh(wheelGeo, wheelMat);
        wMesh.geometry.rotateX(Math.PI / 2);
        wMesh.position.set(pos[0], pos[1], pos[2]);
        wMesh.castShadow = true;
        carGroup.add(wMesh);
        carWheels.push(wMesh);
    });

    return { mesh: carGroup, wheels: carWheels };
}

// Pembuatan unit mobil dari 4 Penjuru
const carLeft = createCar(0x1b4f72, "Mobil Kiri (Biru)");
carLeft.mesh.position.set(-45, 0, 2.5);
const carRight = createCar(0xd35400, "Mobil Kanan (Oranye)");
carRight.mesh.rotation.y = Math.PI;
carRight.mesh.position.set(45, 0, -2.5);
const carTop = createCar(0x78281f, "Mobil Atas (Merah)");
carTop.mesh.rotation.y = -Math.PI / 2;
carTop.mesh.position.set(-2.5, 0, -45);
const carBottom = createCar(0x145a32, "Mobil Bawah (Hijau)");
carBottom.mesh.rotation.y = Math.PI / 2;
carBottom.mesh.position.set(2.5, 0, 45);

scene.add(carLeft.mesh, carRight.mesh, carTop.mesh, carBottom.mesh);

// --- 7. LOGIKA KONTROL LAMPU & SIKLUS PERSIMPANGAN ---
let isRunning = true;
let baseSpeed = 0.15;

let carsData = {
    left:   { mesh: carLeft.mesh,   wheels: carLeft.wheels,   speed: baseSpeed, stopLine: -9,  axis: 'x', dir: 1 },
    right:  { mesh: carRight.mesh,  wheels: carRight.wheels,  speed: baseSpeed, stopLine: 9,   axis: 'x', dir: -1 },
    top:    { mesh: carTop.mesh,    wheels: carTop.wheels,    speed: baseSpeed, stopLine: -9,  axis: 'z', dir: 1 },
    bottom: { mesh: carBottom.mesh, wheels: carBottom.wheels, speed: baseSpeed, stopLine: 9,   axis: 'z', dir: -1 }
};

const STATES = ["LEFT_GREEN", "TOP_GREEN", "RIGHT_GREEN", "BOTTOM_GREEN"];
let currentStateIndex = 0;
let lastStateChange = Date.now();

// Fungsi pengatur warna lampu fisik (Emissive/Bercahaya saat aktif)
function setLightStatus(lightObj, colorHex, isIdling) {
    if (isIdling) {
        lightObj.material.color.setHex(colorHex);
        if(lightObj.material.emissive) lightObj.material.emissive.setHex(colorHex);
    } else {
        // Redupkan warna jika lampu sedang mati (Off)
        const dimColor = colorHex === 0xff0000 ? 0x330000 : colorHex === 0xffff00 ? 0x333300 : 0x003300;
        lightObj.material.color.setHex(dimColor);
        if(lightObj.material.emissive) lightObj.material.emissive.setHex(0x000000);
    }
}

function applyTrafficColors() {
    const state = STATES[currentStateIndex];

    // Default: Semua jalur MERAH dinyalakan, Kuning & Hijau dimatikan
    const lights = [tlL, tlR, tlT, tlB];
    lights.forEach(tl => {
        setLightStatus(tl.red, 0xff0000, true);
        setLightStatus(tl.yellow, 0xffff00, false);
        setLightStatus(tl.green, 0x00ff00, false);
    });

    // Jalankan kondisi khusus lampu hijau pada jalur aktif
    if (state === "LEFT_GREEN") {
        setLightStatus(tlL.red, 0xff0000, false);
        setLightStatus(tlL.green, 0x00ff00, true);
    }
    if (state === "RIGHT_GREEN") {
        setLightStatus(tlR.red, 0xff0000, false);
        setLightStatus(tlR.green, 0x00ff00, true);
    }
    if (state === "TOP_GREEN") {
        setLightStatus(tlT.red, 0xff0000, false);
        setLightStatus(tlT.green, 0x00ff00, true);
    }
    if (state === "BOTTOM_GREEN") {
        setLightStatus(tlB.red, 0xff0000, false);
        setLightStatus(tlB.green, 0x00ff00, true);
    }
}
applyTrafficColors();

function updateTrafficLights() {
    if (!isRunning) return;
    if (Date.now() - lastStateChange > 5000) {
        currentStateIndex = (currentStateIndex + 1) % STATES.length;
        applyTrafficColors();
        lastStateChange = Date.now();
    }
}

// --- 8. EVENT LISTENERS (HTML UI, KEYBOARD & RAYCAST CLICK/HOVER) ---
const tooltip = document.getElementById("tooltip");

document.getElementById("btn-start").addEventListener("click", () => isRunning = true);
document.getElementById("btn-pause").addEventListener("click", () => isRunning = false);
document.getElementById("btn-reset").addEventListener("click", () => {
    carLeft.mesh.position.set(-45, 0, 2.5);
    carRight.mesh.position.set(45, 0, -2.5);
    carTop.mesh.position.set(-2.5, 0, -45);
    carBottom.mesh.position.set(2.5, 0, 45);
    baseSpeed = 0.15;
    Object.keys(carsData).forEach(k => carsData[k].speed = baseSpeed);
    currentStateIndex = 0;
    applyTrafficColors();
    lastStateChange = Date.now();
});

window.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === 'w') baseSpeed = Math.min(baseSpeed + 0.02, 0.4);
    if (e.key.toLowerCase() === 's') baseSpeed = Math.max(baseSpeed - 0.02, 0.03);
});

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener("mousemove", (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    let hoveredCarName = null;
    for (let i = 0; i < intersects.length; i++) {
        let obj = intersects[i].object;
        while (obj.parent) {
            if (obj.name && obj.name.startsWith("Mobil")) {
                hoveredCarName = obj.name;
                break;
            }
            obj = obj.parent;
        }
    }

    if (hoveredCarName) {
        tooltip.innerText = hoveredCarName;
        tooltip.style.display = "block";
        tooltip.style.left = e.clientX + 15 + "px";
        tooltip.style.top = e.clientY + 15 + "px";
    } else {
        tooltip.style.display = "none";
    }
});

window.addEventListener("click", () => {
    raycaster.setFromCamera(mouse, camera);
    // Gabungkan seluruh part lensa lampu agar bisa mendeteksi klik mouse
    const lightsClickable = [
        tlL.red, tlL.yellow, tlL.green,
        tlR.red, tlR.yellow, tlR.green,
        tlT.red, tlT.yellow, tlT.green,
        tlB.red, tlB.bottom, tlB.green
    ];
    const intersects = raycaster.intersectObjects(lightsClickable);

    if (intersects.length > 0) {
        // Klik lampu mana saja akan langsung mengganti giliran hijau jalan
        currentStateIndex = (currentStateIndex + 1) % STATES.length;
        applyTrafficColors();
        lastStateChange = Date.now();
    }
});

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- 9. ANIMATION LOOP ---
function animate() {
    requestAnimationFrame(animate);

    updateTrafficLights();

    if (isRunning) {
        const state = STATES[currentStateIndex];

        Object.keys(carsData).forEach(key => {
            const car = carsData[key];
            
            let isRed = true;
            if (key === 'left'   && state === "LEFT_GREEN")   isRed = false;
            if (key === 'right'  && state === "RIGHT_GREEN")  isRed = false;
            if (key === 'top'    && state === "TOP_GREEN")    isRed = false;
            if (key === 'bottom' && state === "BOTTOM_GREEN") isRed = false;

            const currentPos = car.mesh.position[car.axis];
            const nextPos = currentPos + (car.speed * car.dir);

            if (isRed) {
                if (car.dir === 1 && currentPos < car.stopLine && nextPos >= car.stopLine) {
                    car.speed = 0; // Berhenti tepat di belakang garis henti kuning zebra cross
                } else if (car.dir === -1 && currentPos > car.stopLine && nextPos <= car.stopLine) {
                    car.speed = 0;
                }
            } else {
                car.speed = baseSpeed;
            }

            // Jalankan translasi mobil
            car.mesh.position[car.axis] += car.speed * car.dir;

            // Jalankan animasi rotasi roda
            if (car.speed > 0) {
                car.wheels.forEach(wheel => {
                    if (car.axis === 'x') {
                        wheel.rotation.z -= (car.speed * car.dir) / 0.3;
                    } else {
                        wheel.rotation.x += (car.speed * car.dir) / 0.3;
                    }
                });
            }

            // Looping koordinat mobil saat keluar dari area peta jalan (30 unit)
            if (car.dir === 1 && car.mesh.position[car.axis] > 45) {
                car.mesh.position[car.axis] = -45;
            } else if (car.dir === -1 && car.mesh.position[car.axis] < -45) {
                car.mesh.position[car.axis] = 45;
            }
        });
    }

    renderer.render(scene, camera);
}

animate();