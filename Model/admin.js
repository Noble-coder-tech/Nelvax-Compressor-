// Re-establish Firestore parsing configurations
const firebaseConfig = {
  apiKey: "AIzaSyAkeA8InvvBhpp4rH2g5YsV7ZMrnPgcTIk",
  authDomain: "nelvax-tech.firebaseapp.com",
  projectId: "nelvax-tech",
  storageBucket: "nelvax-tech.firebasestorage.app",
  messagingSenderId: "1028641621168",
  appId: "1:1028641621168:web:53f93374642b44b30b2775"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// 1. DEDICATED ACCESS TOKEN GUARDIAN RULE
auth.onAuthStateChanged(function(user) {
    const isLoginVerified = sessionStorage.getItem('isAdminAuthenticated');
    
    if (user && isLoginVerified === 'true') {
        // Enforce the special Admin User ID check again for double protection
        if (user.uid !== "N5B00u4pljMeLIRPsd2oVoM2jsH2") {
            bootUserToGate();
        } else {
            document.getElementById('admin-tag').innerText = "Console Administrator: " + user.email;
            streamLiveUserData(); // Turn on the real-time stream!
        }
    } else {
        bootUserToGate();
    }
});

function bootUserToGate() {
    sessionStorage.removeItem('isAdminAuthenticated');
    window.location.href = "admin-login.html";
}

// 2. REAL-TIME EVENT STREAM (onSnapshot Listener)
function streamLiveUserData() {
    const tableBody = document.getElementById('live-user-rows');
    
    // Listening directly to your "users" collection folder in Firestore
    db.collection("users").onSnapshot(function(querySnapshot) {
        tableBody.innerHTML = ""; // Clear existing table layout rows dynamically
        
        let totalCount = 0;
        let verifiedCount = 0;

        querySnapshot.forEach(function(doc) {
            totalCount++;
            const userData = doc.data();
            const emailIsVerified = userData.emailVerified || false;
            if (emailIsVerified) verifiedCount++;

            // Create new row elements dynamically on data shifts
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-family: monospace; color: #3b82f6;">${doc.id}</td>
                <td>${userData.email || 'No Email Registered'}</td>
                <td>
                    <span class="badge ${emailIsVerified ? 'yes' : 'no'}">
                        ${emailIsVerified ? 'Verified' : 'Unverified'}
                    </span>
                </td>
                <td>
                    <button class="purge-btn" onclick="deleteUserAccount('${doc.id}')">Erase Node</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        // Push real-time numeric calculations directly into card panels
        document.getElementById('total-users-metric').innerText = totalCount;
        document.getElementById('verified-users-metric').innerText = verifiedCount;
    }, function(error) {
        console.error("Real-time data stream failure:", error.message);
    });
}

// 3. ADVANCED CRAZY FEATURES: DATA OVERRIDE TERMINALS
window.deleteUserAccount = function(uid) {
    if (confirm("Warning! Are you sure you want to delete user profile token " + uid + " from Firestore?")) {
        db.collection("users").doc(uid).delete()
            .then(function() {
                alert("User record deleted from database successfully.");
            })
            .catch(function(err) {
                alert("Error writing to database: " + err.message);
            });
    }
};

// 4. SWITCH CONFIGURATIONS FOR APP CONTROLS
function registerToggleAction(buttonId, configField) {
    const btn = document.getElementById(buttonId);
    btn.addEventListener('click', function() {
        if (btn.classList.contains('active')) {
            btn.classList.remove('active');
            btn.classList.add('disabled');
            btn.innerText = "DISABLED";
            console.log(configField + " flag set to inactive.");
        } else {
            btn.classList.remove('disabled');
            btn.classList.add('active');
            btn.innerText = "ENABLED";
            console.log(configField + " flag set to active.");
        }
    });
}
registerToggleAction('toggle-compressor', 'Compressor Module');
registerToggleAction('toggle-reverser', 'Reverser Module');

// 5. EMERGENCY BROADCAST SUBMISSION SYSTEM
document.getElementById('send-broadcast-btn').addEventListener('click', function() {
    const alertMsg = document.getElementById('alert-text').value;
    if (!alertMsg.trim()) return alert("Please fill in an alert message text first!");
    
    // Save to an application control node in Firestore for user views
    db.collection("system-config").doc("announcements").set({
        message: alertMsg,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function() {
        alert("Emergency notice broadcasted to all workspaces!");
        document.getElementById('alert-text').value = "";
    });
});

// 6. DISCONNECT SYSTEM TRIGGER
document.getElementById('logout-link').addEventListener('click', function(e) {
    e.preventDefault();
    if (confirm("Disconnect authentication link and lock admin dashboard?")) {
        auth.signOut().then(function() {
            bootUserToGate();
        });
    }
});
