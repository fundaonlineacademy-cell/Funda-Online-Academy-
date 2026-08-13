const { createClient } = supabase;
const db = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
const loginForm=document.getElementById("login-form"), signupForm=document.getElementById("signup-form");
const loginTab=document.getElementById("login-tab"), signupTab=document.getElementById("signup-tab"), msg=document.getElementById("message");
function showMessage(t,ok=false){msg.textContent=t;msg.className="message "+(ok?"success":"error");}
function setMode(mode){const login=mode!=="signup";loginForm.classList.toggle("hidden",!login);signupForm.classList.toggle("hidden",login);loginTab.classList.toggle("active",login);signupTab.classList.toggle("active",!login);history.replaceState(null,"",`auth.html?mode=${login?"login":"signup"}`);}
loginTab.onclick=()=>setMode("login"); signupTab.onclick=()=>setMode("signup");
if(new URLSearchParams(location.search).get("mode")==="signup")setMode("signup");

async function guardExisting(){
 if(window.SUPABASE_URL.includes("PASTE_")) return;
 const {data:{session}}=await db.auth.getSession();
 if(session) location.href="dashboard.html";
}
guardExisting();

loginForm.onsubmit=async e=>{
  e.preventDefault();

  const email=document.getElementById("login-email").value.trim();
  const password=document.getElementById("login-password").value;

  const {data,error}=await db.auth.signInWithPassword({
    email,
    password
  });

  if(error){
    alert(error.message);
    return;
  }

  if(data.session){
    location.href="dashboard.html";
  }
};
signupForm.onsubmit=async e=>{
  e.preventDefault();

  if(window.SUPABASE_URL.includes("PASTE_")) return;

  const name=document.getElementById("signup-name").value.trim();
  const email=document.getElementById("signup-email").value.trim();
  const password=document.getElementById("signup-password").value;

  const {data,error}=await db.auth.signUp({
    email,
    password,
    options:{data:{full_name:name}}
  });

  if(error) return showMessage(error.message);

  if(data.session){
    location.href="dashboard.html";
  }else{
    showMessage("Account created successfully. Please check your email to confirm your account.",true);
    setMode("login");
  }
};
document.getElementById("forgot").onclick=async()=>{
 const email=document.getElementById("login-email").value.trim();
 if(!email)return showMessage("Enter your email address first.");
 if(window.SUPABASE_URL.includes("PASTE_")) return showMessage("Supabase is not connected yet.");
 const {error}=await db.auth.resetPasswordForEmail(email,{redirectTo:location.origin+"/auth.html"});
 if(error)return showMessage(error.message); showMessage("Password reset instructions have been sent to your email.",true);
};
