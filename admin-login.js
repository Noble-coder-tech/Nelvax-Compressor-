// Firebase configuration
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

document.getElementById('admin-login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    const loginBtn = document.getElementById('login-btn');
    
    loginBtn.disabled = true;
    loginBtn.innerText = "Verifying...";

    auth.signInWithEmailAndPassword(email, password)
        .then(function(userCredential) {
            const user = userCredential.user;
            
            // SECURITY GATE: Check against your explicit User ID code block string
            if (user.uid === "N5B00u4pljMeLIRPsd2oVoM2jsH2") {
                // Store a secure local key showing they passed the admin screen checks
                sessionStorage.setItem('isAdminAuthenticated', 'true');
                window.location.href = "admin.html";
            } else {
                // If they are a normal user, boot them off immediately!
                alert("Access Denied: Your User ID is not on the admin roster.");
                auth.signOut();
                window.location.reload();
            }
        })
        .catch(function(error) {
            alert("Error: " + error.message);
            loginBtn.disabled = false;
            loginBtn.innerText = "Verify Identity";
        });
});
