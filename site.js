const { createClient } = supabase;
const db = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

const fallbackCourses = [
{"title": "Cashier", "price": 450, "category": "Retail", "duration": "1–2 Weeks", "modules": ["Retail customer service foundation", "POS / till basics", "Scanning, returns & voids", "Cash handling", "Card, EFT & vouchers", "Float, cash-up & balancing", "Theft prevention & company policy", "Difficult customers"], "description": ""},
{"title": "Petrol Station Attendant", "price": 900, "category": "Fuel Retail", "duration": "1 Week", "modules": ["Customer service", "Forecourt operations", "Fuel station safety", "Fuel handling awareness", "Professional conduct", "Workplace communication"], "description": ""},
{"title": "Merchandising", "price": 440, "category": "Retail", "duration": "1–2 Weeks", "modules": ["Merchandising foundations", "Product presentation", "Displays & shelf standards", "Stock awareness", "Promotions & displays", "Workplace standards"], "description": ""},
{"title": "Customer Service", "price": 550, "category": "Workplace Skills", "duration": "1–2 Weeks", "modules": ["Customer service foundations", "Professional communication", "Customer needs", "Handling complaints", "Difficult customers", "Service excellence"], "description": ""},
{"title": "Hotel Receptionist", "price": 550, "category": "Hospitality", "duration": "1–2 Weeks", "modules": ["Front office foundations", "Guest reception", "Reservations basics", "Telephone & email etiquette", "Guest complaints", "Professional presentation"], "description": ""},
{"title": "Food and Beverage", "price": 450, "category": "Hospitality", "duration": "1–2 Weeks", "modules": ["Food & beverage foundations", "Customer service", "Table service basics", "Food safety awareness", "Professional hygiene", "Guest satisfaction"], "description": ""},
{"title": "Food and Safety", "price": 900, "category": "Food & Hospitality", "duration": "3–4 Weeks", "modules": ["Food safety foundations", "Personal hygiene", "Safe food handling", "Cross-contamination awareness", "Cleaning and sanitation", "Workplace food safety"], "description": ""},
{"title": "Skills in Childcare and Young People Development", "price": 900, "category": "Care Skills", "duration": "3–4 Weeks", "modules": ["Childcare foundations", "Child development", "Safety and wellbeing", "Communication with children", "Activities and learning", "Professional practice"], "description": ""},
{"title": "Hair Styling", "price": 3500, "category": "Beauty", "duration": "Flexible", "modules": ["Hair styling foundations", "Hair preparation", "Styling techniques", "Client consultation", "Salon hygiene", "Professional practice"], "description": ""},
{"title": "Computer Skills", "price": 3500, "category": "Digital Skills", "duration": "Flexible", "modules": ["Computer basics", "File and folder management", "Internet and email", "Word processing", "Spreadsheets", "Digital safety"], "description": ""},
{"title": "Basic Skills in Farming", "price": 550, "category": "Agriculture", "duration": "Flexible", "modules": ["Soil basics", "Crop production", "Plant care", "Watering", "Basic farm safety", "Harvesting awareness"], "description": ""},
{"title": "Baking Basics", "price": 2500, "category": "Food Skills", "duration": "3–4 Weeks", "modules": ["Baking equipment", "Ingredient functions", "Mixing methods", "Bread basics", "Cakes and pastries", "Food hygiene"], "description": ""},
{"title": "Make-Up Artistry", "price": 4000, "category": "Beauty", "duration": "2–3 Weeks", "modules": ["Make-up tools", "Skin preparation", "Foundation and complexion", "Eye make-up", "Colour basics", "Professional client practice"], "description": ""},
{"title": "Basic Skills in Carpentry", "price": 1200, "category": "Construction", "duration": "Flexible", "modules": ["Carpentry tools", "Measuring and marking", "Wood types", "Basic joints", "Safe tool use", "Basic projects"], "description": ""},
{"title": "Introduction to Construction", "price": 950, "category": "Construction", "duration": "Flexible", "modules": ["Construction basics", "Methods and sequence", "Site safety", "Tools and materials", "Basic construction terminology", "Workplace practice"], "description": ""},
{"title": "Basic Skills in Fashion Design", "price": 2600, "category": "Fashion", "duration": "6–8 Weeks", "modules": ["Fashion design foundations", "Measurements", "Design concepts", "Fabric basics", "Pattern basics", "Garment construction"], "description": ""},
{"title": "Nail Artistry", "price": 3500, "category": "Beauty", "duration": "Flexible", "modules": ["Nail care", "Tools and hygiene", "Basic manicure", "Nail art techniques", "Client preparation", "Professional practice"], "description": ""},
{"title": "Introduction to Sewing", "price": 3500, "category": "Fashion", "duration": "Flexible", "modules": ["Sewing machine basics", "Tools and equipment", "Fabric handling", "Basic stitches", "Simple garment construction", "Sewing safety"], "description": ""},
{"title": "Housekeeping", "price": 550, "category": "Hospitality", "duration": "1 Week", "modules": ["Housekeeping foundations", "Cleaning procedures", "Room preparation", "Linen handling", "Hygiene and safety", "Professional standards"], "description": ""},
{"title": "Introduction to Fire and Safety", "price": 499, "category": "Safety", "duration": "Flexible", "modules": ["Fire safety foundations", "Hazard awareness", "Emergency procedures", "Fire prevention", "Workplace safety", "Basic response principles"], "description": ""},
{"title": "Warehouse Associate", "price": 750, "category": "Logistics", "duration": "Flexible", "modules": ["Warehouse operations", "Stock handling", "Receiving and dispatch", "Storage basics", "Safety procedures", "Workplace organisation"], "description": ""},
{"title": "Professional Cleaning", "price": 450, "category": "Cleaning Services", "duration": "1 Week", "modules": ["Cleaning equipment", "Cleaning methods", "Chemical safety", "Workplace hygiene", "Professional standards", "Cleaning schedules"], "description": ""},
{"title": "Skills in Business Administration", "price": 1200, "category": "Business", "duration": "3–4 Weeks", "modules": ["Office administration", "Communication", "Document management", "Customer service", "Scheduling", "Basic workplace organisation"], "description": ""},
{"title": "Painting Skills", "price": 450, "category": "Construction", "duration": "1 Week", "modules": ["Surface preparation", "Tools and materials", "Priming", "Painting techniques", "Finishing", "Workplace safety"], "description": ""},
{"title": "Basic Skills in Retail Management", "price": 1200, "category": "Retail", "duration": "3–4 Weeks", "modules": ["Retail operations", "Stock management", "Merchandising", "Customer service", "Team supervision", "Basic retail administration"], "description": ""},
{"title": "Receptionist Skills", "price": 900, "category": "Workplace Skills", "duration": "4–6 Weeks", "modules": ["Reception duties", "Telephone etiquette", "Visitor management", "Appointments", "Professional communication", "Front-desk organisation"], "description": ""},
{"title": "Gardening", "price": 950, "category": "Agriculture", "duration": "3–4 Weeks", "modules": ["Garden planning", "Soil preparation", "Planting", "Watering", "Pruning", "Garden maintenance"], "description": ""}
];

function money(n){return "R" + Number(n).toLocaleString("en-ZA",{maximumFractionDigits:0});}
function card(c){
  const modules=(c.modules||[]).slice(0,6).map(x=>`<li>${escapeHtml(x)}</li>`).join("");
  return `<article class="card course">${c.image_url?`<img class="course-image" src="${escapeAttr(c.image_url)}" alt="">`:''}
  <span class="tag">${escapeHtml(c.category||"Course")}</span><h3>${escapeHtml(c.title)}</h3>
  <p class="course-desc">${escapeHtml(c.description||"Flexible online short course.")}</p>
  ${c.duration?`<div class="duration">Duration: ${escapeHtml(c.duration)}</div>`:""}
  ${modules?`<ul>${modules}</ul>`:""}
  <div class="course-foot"><span class="from">Course price</span><span class="price">${money(c.price)}</span></div>
  <a class="btn green full" href="auth.html?mode=signup">Create account to enrol</a></article>`;
}
async function loadCourses(){
 const grid=document.getElementById("course-grid"); if(!grid)return;
 if(window.SUPABASE_URL.includes("PASTE_")){grid.innerHTML=fallbackCourses.map(card).join(""); return;}
 const {data,error}=await db.from("courses").select("*").eq("active",true).order("title");
 if(error){grid.innerHTML=fallbackCourses.map(card).join(""); console.error(error); return;}
 grid.innerHTML=(data||[]).map(card).join("") || "<p>No courses available yet.</p>";
}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function escapeAttr(s){return escapeHtml(s).replace(/`/g,"&#096;");}
loadCourses();
