import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    setPersistence,             
    browserLocalPersistence,    
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    sendEmailVerification,     
    sendPasswordResetEmail,
    signOut     
}  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { db } from './firebase-config.js'; 
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'; 


const firebaseConfig = {
  apiKey: "AIzaSyAkeA8InvvBhpp4rH2g5YsV7ZMrnPgcTIk",
  authDomain: "nelvax-tech.firebaseapp.com",
  projectId: "nelvax-tech",
  storageBucket: "nelvax-tech.firebasestorage.app",
  messagingSenderId: "1028641621168",
  appId: "1:1028641621168:web:53f93374642b44b30b2775"
};

// Initialize Firebase Node Safely
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// =========================================================
// 1. THE AUTHENTICATION OBSERVER
// =========================================================
auth.onAuthStateChanged(async (user) => {
    const path = window.location.pathname.toLowerCase();
    
    // Flexible path inclusions to safely bypass server string mutations
    const isSignInPage   = path.includes("signin") || path === "/" || path.endsWith("/");
    const isSignUpPage   = path.includes("signup");
    const isForgotPage   = path.includes("forget") || path.includes("forgot");
    const isVerifyPage   = path.includes("verification");
    
    const isAuthPage = isSignInPage || isSignUpPage || isForgotPage;

    if (user) {
        const isGoogleUser = user.providerData.some(p => p.providerId === 'google.com');

        if (!isGoogleUser && !user.emailVerified) {
            sessionStorage.setItem('pendingEmailVerification', 'true');
        }

        if (isGoogleUser || user.emailVerified) {
            if (sessionStorage.getItem('pendingEmailVerification') === 'true' && isVerifyPage) {
                sessionStorage.removeItem('pendingEmailVerification');
                await signOut(auth);
                window.location.href = "signin.html";
                return; 
            }

            if (isAuthPage) {
                window.location.href = "compressor.html";
            } else {
                exposeProtectedDom(); 
            }
        } else {
            if (!isVerifyPage) {
                window.location.href = "verification.html";
            } else {
                exposeProtectedDom(); 
                setupVerificationExitTrigger();
            }
        }
    } else {
        sessionStorage.removeItem('pendingEmailVerification');

        // STRICT GATEKEEPER: If no active user session exists and they are NOT on an auth page, boot them!
        if (!isAuthPage && !isVerifyPage) {
            window.location.href = "signin.html";
            return; // Terminate execution immediately
        }

        if (isSignInPage || isSignUpPage || isForgotPage) {
            exposeProtectedDom();
        } else {
            window.location.href = "signin.html"; 
        }
    }
});

function setupVerificationExitTrigger() {
    const exitBtn = document.getElementById('backToSignInBtn') || document.querySelector('.back-to-signin');
    
    if (exitBtn && !exitBtn.dataset.listenerAttached) {
        exitBtn.dataset.listenerAttached = 'true'; 
        
        exitBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            sessionStorage.removeItem('pendingEmailVerification');
            try {
                await signOut(auth);
                window.location.href = "signin.html";
            } catch (err) {
                window.location.href = "signin.html"; 
            }
        });
    }
}

function exposeProtectedDom() {
    document.body.classList.add('auth-ready');
}


// =========================================================
// 2. SIGN UP LOGIC
// =========================================================
const signupForm = document.getElementById('signup-form');
if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        
        sessionStorage.setItem('userEmail', email);

        setPersistence(auth, browserLocalPersistence)
            .then(() => {
                return createUserWithEmailAndPassword(auth, email, password);
            })
            .then(async (userCredential) => {
                const user = userCredential.user;

                // 1. Send verification email instantly
                try {
                    await sendEmailVerification(user);
                    console.log("Initial verification email sent successfully!");
                } catch (emailErr) {
                    console.error("Verification email pipeline error:", emailErr.message);
                }

                // 2. Display email on verification screen if element exists
                const emailShowVer = document.getElementById('email-123');
                if (emailShowVer) {
                    emailShowVer.innerText = email;
                }
            })
            .catch(err => alert(err.message));
    });
}
//=========================================================
// 3. SIGN IN LOGIC
// =========================================================
const signinForm = document.getElementById('signin-form');
if (signinForm) {
    signinForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('signin-email').value;
        const password = document.getElementById('signin-password').value;
        
        setPersistence(auth, browserLocalPersistence)
            .then(() => {
                return signInWithEmailAndPassword(auth, email, password);
            })
            .catch(err => alert(err.message));
    });
}

// =========================================================
// 4. GOOGLE AUTH LOGIC
// =========================================================
const googleBtns = ["google-signup", "google-signin"];
googleBtns.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
        btn.addEventListener('click', () => {
            setPersistence(auth, browserLocalPersistence)
                .then(() => {
                    return signInWithPopup(auth, provider);
                })
                .catch(err => console.error(err));
        });
    }
});

// =========================================================
// 5. EMAIL VERIFICATION TIMER LOGIC
// =========================================================
const resendBtn = document.getElementById('resend');
if (resendBtn) {
    resendBtn.addEventListener('click', () => {
        const currentUser = auth.currentUser;
        if (currentUser) {
            sendEmailVerification(currentUser)
                .then(() => alert("Verification email sent! Please check your inbox."))
                .catch(err => alert("Error sending email: " + err.message));

            let timeLeft = 30;
            resendBtn.disabled = true;
            resendBtn.classList.add("resenddisabled"); 
            resendBtn.innerText = "Resend in " + timeLeft + "s";

            const countdown = setInterval(() => {
                timeLeft--;
                resendBtn.innerText = "Resend in " + timeLeft + "s";

                if (timeLeft <= 0) {
                    clearInterval(countdown); 
                    resendBtn.disabled = false; 
                    resendBtn.classList.remove("resenddisabled");
                    resendBtn.innerText = "Resend?"; 
                }
            }, 1000); 
        } else {
            alert("No user session found. Please try signing up again.");
        }
    });
}

// =========================================================
// 6. FORGOT PASSWORD LOGIC
// =========================================================
const forgotForm = document.getElementById('forgot-form');
const resetBtn = document.getElementById('reset-btn');
if (forgotForm && resetBtn) {
    forgotForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('forgot-email').value;

        sendPasswordResetEmail(auth, email)
            .then(() => {
                alert("Password reset link sent! Please check your email inbox.");
                
                let timeLeft = 30;
                resetBtn.disabled = true; 
                resetBtn.innerText = "Resend in " + timeLeft + "s";

                const countdown = setInterval(() => {
                    timeLeft--;
                    resetBtn.innerText = "Resend in " + timeLeft + "s";

                    if (timeLeft <= 0) {
                        clearInterval(countdown); 
                        resetBtn.disabled = false; 
                        resetBtn.innerText = "Send Reset Link"; 
                    }
                }, 1000);
            })
            .catch(err => alert("Error: " + err.message));
    });
}

// =========================================================
// 7. SIGNUP TERMS CHECKBOX REGULATION
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
    const googleSignupButton = document.getElementById('google-signup');
    const signupButton       = document.getElementById('signup-btn');
    const checkBox           = document.getElementById('tickbox');

    if (checkBox && signupButton && googleSignupButton) {
        function syncButtonState() {
            if (checkBox.checked) {
                signupButton.disabled = false;
                googleSignupButton.disabled = false;
                signupButton.classList.remove("signup-disabled");
                googleSignupButton.classList.remove("google-disabled");
            } else {
                signupButton.disabled = true;
                googleSignupButton.disabled = true;
                signupButton.classList.add("signup-disabled");
                googleSignupButton.classList.add("google-disabled");
            }
        }
        syncButtonState();
        checkBox.addEventListener('change', syncButtonState);
    }
});

// =========================================================
// 8. LOGOUT SYSTEM CONTROLLER
// =========================================================
function handleUserLogout() {
    signOut(auth)
        .then(() => {
            window.location.href = 'signin.html'; 
        })
        .catch(error => console.error("Error signing out:", error));
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to log out?")) {
            handleUserLogout();
        }
    });
}
