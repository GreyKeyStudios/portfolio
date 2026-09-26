import type { PortfolioProject } from "@/lib/portfolio-projects"

type Readiness = "verified" | "reusable" | "audit" | "planned" | "future"

const systemLayers: Array<{number:string;title:string;subtitle:string;status:Readiness;label:string;detail:string}> = [
  {number:"01",title:"Bridge Academy",subtitle:"School · programs · pathways",status:"planned",label:"Designed / planned",detail:"The educational institution and program model. Not yet an operating school."},
  {number:"02",title:"My Bridge",subtitle:"Unified student + instructor experience",status:"planned",label:"Planned",detail:"A future front door for pathways, projects, evidence, progress, and support."},
  {number:"03",title:"ReLearn",subtitle:"Learning · competencies · assessment · mastery",status:"reusable",label:"Existing / reusable",detail:"A working learning engine that can be adapted to carry Bridge curriculum."},
  {number:"04",title:"Digital Laboratories",subtitle:"GK Studio · Atlas · Citizen Science · simulations",status:"audit",label:"Mixed readiness",detail:"Independent products and concepts that could become places to practice and demonstrate learning."},
  {number:"05",title:"Student Success",subtitle:"LifeOS · CareerOS",status:"audit",label:"Integration requires audit",detail:"Independent tools with potential student-support and career-transition roles."},
]

const method = ["Understand","Investigate","Plan","Build","Test","Troubleshoot","Iterate","Document","Communicate","Demonstrate"]
const rhythm = ["Learn","Explore","Build","Simulate","Demonstrate"]

const labs = [
  {name:"ReLearn",role:"Learning engine",status:"Reusable with modification",tone:"reusable",src:"/portfolio/relearn.png",alt:"ReLearn course interface"},
  {name:"GK Studio",role:"Music technology laboratory",status:"Implementation requires audit",tone:"audit",src:"/portfolio/gk-plugin-suite.png",alt:"Grey Key music software preview"},
  {name:"Diaspora Atlas",role:"Culture and history laboratory",status:"Existing project · adaptation needed",tone:"reusable",src:"/portfolio/diaspora-atlas.png",alt:"Diaspora Atlas interface"},
  {name:"Citizen Science",role:"Investigation laboratory",status:"Conceptual",tone:"future",src:"/portfolio/citizen-science.png",alt:"Citizen Science concept interface"},
  {name:"LifeOS",role:"Student-success potential",status:"Features require audit",tone:"audit",src:"/portfolio/lifeos.png",alt:"LifeOS interface"},
  {name:"CareerOS",role:"Career-transition potential",status:"Features require audit",tone:"audit",src:"/portfolio/careeros.png",alt:"CareerOS interface"},
]

const pathways = [
  {number:"01",name:"IT Support & Networking",examples:"Build a computer · configure a server · build and defend a small network"},
  {number:"02",name:"Music Technology",examples:"Produce and record · build MIDI hardware · program plugins and synthesizers"},
  {number:"03",name:"Creative Computing",examples:"Design and publish websites · code interactive tools · connect media systems"},
  {number:"04",name:"Applied STEM Foundations",examples:"Use physics, acoustics, electronics, data, and fabrication to solve real problems"},
]

const evidence: Array<{status:Readiness;label:string;items:string[]}> = [
  {status:"verified",label:"Existing / verified",items:["Bridge curriculum and planning archive","ReLearn learning engine and product captures","Diaspora Atlas live project"]},
  {status:"reusable",label:"Reusable with modification",items:["ReLearn competency and mastery direction","Music-production curriculum model","Diaspora Atlas as a cultural laboratory"]},
  {status:"audit",label:"Implementation requires audit",items:["GK Studio education readiness","LifeOS and CareerOS student-support fit","Cross-product identity, data, and integrations"]},
  {status:"planned",label:"Planned",items:["My Bridge portal","Four initial pathways","Controlled pilot delivery"]},
  {status:"future",label:"Conceptual / future",items:["Citizen Science learning lab","3D simulations and world labs","Distributed partners and flagship campus"]},
]

export function BridgeAcademySection({ project }: { project: PortfolioProject }) {
  return <section className="bridge-system" id="bridge" aria-labelledby="bridge-system-title">
    <header className="bridge-system__hero">
      <div className="bridge-system__hero-copy">
        <div className="bridge-system__eyebrow"><span>09 / EDUCATION SYSTEM</span><b><i/>PROPOSED PROGRAM</b></div>
        <p className="bridge-system__overline">BRIDGE ACADEMY / DIGITAL SCHOOL SYSTEM</p>
        <h2 id="bridge-system-title">Build better<br/><em>builders.</em></h2>
        <p className="bridge-system__dek">An emerging educational system built around a simple idea: students should learn how to understand a problem, investigate it, build something, test it, troubleshoot it, improve it, and demonstrate what they know.</p>
        <div className="bridge-system__pillars" aria-label="Bridge Academy pillars"><span>Music</span><span>STEM</span><span>Culture</span><span>Entrepreneurship</span></div>
      </div>
      <div className="bridge-system__map" aria-label="Proposed Bridge Academy digital school architecture">
        <div className="bridge-system__map-head"><span>SYSTEM MAP / PROPOSED ARCHITECTURE</span><small>ONE LEARNING JOURNEY · MULTIPLE INDEPENDENT TOOLS</small></div>
        <ol>{systemLayers.map((layer,index)=><li key={layer.title} className={`bridge-system__layer bridge-system__layer--${layer.status}`}>
          <span>{layer.number}</span><div><h3>{layer.title}</h3><p>{layer.subtitle}</p></div><b>{layer.label}</b><small>{layer.detail}</small>{index<systemLayers.length-1&&<i aria-hidden="true">↓</i>}
        </li>)}</ol>
      </div>
    </header>

    <aside className="bridge-system__truth"><strong>THE PORTFOLIO CLAIM</strong><p>Bridge Academy is a proposed school system with substantial curriculum, research, and product-design work behind it. The connected architecture below is a direction—not a claim that one unified platform or operating school already exists.</p></aside>

    <section className="bridge-system__method" aria-labelledby="bridge-method-title">
      <header><span>01 / THE METHOD</span><h3 id="bridge-method-title">Capability is built<br/><em>in the doing.</em></h3><p>The technology changes. The durable practice is learning how to move from a question to evidence, a working artifact, and a clear demonstration.</p></header>
      <ol>{method.map((step,index)=><li key={step}><span>{String(index+1).padStart(2,"0")}</span><b>{step}</b></li>)}</ol>
      <div className="bridge-system__rhythm">{rhythm.map((step,index)=><span key={step}><b>{step}</b>{index<rhythm.length-1&&<i>→</i>}</span>)}</div>
    </section>

    <section className="bridge-system__labs" aria-labelledby="bridge-labs-title">
      <header><span>02 / THE REVEAL</span><h3 id="bridge-labs-title">Separate projects.<br/><em>A possible ecosystem.</em></h3><p>These products retain their own identities and uses. Bridge Academy reveals how selected systems could also become learning environments, evidence tools, and transition support.</p></header>
      <div className="bridge-system__lab-grid">{labs.map(lab=><article key={lab.name}>
        <figure><img src={lab.src} alt={lab.alt}/></figure><div><span className={`bridge-system__tag bridge-system__tag--${lab.tone}`}>{lab.status}</span><h4>{lab.name}</h4><p>{lab.role}</p></div>
      </article>)}</div>
    </section>

    <section className="bridge-system__pathways" aria-labelledby="bridge-pathways-title">
      <header><span>03 / PROPOSED V0 PATHWAYS</span><h3 id="bridge-pathways-title">Four ways into<br/><em>the same practice.</em></h3><p>Each pathway would share research, source evaluation, writing, numeracy, project management, ethics, portfolio evidence, and presentation.</p></header>
      <div>{pathways.map(path=><article key={path.name}><span>{path.number} / PLANNED</span><h4>{path.name}</h4><p>{path.examples}</p></article>)}</div>
    </section>

    <section className="bridge-system__evidence" aria-labelledby="bridge-evidence-title">
      <header><span>04 / READINESS MAP</span><h3 id="bridge-evidence-title">The vision is large.<br/><em>The labels stay precise.</em></h3></header>
      <div>{evidence.map(group=><article key={group.label} className={`bridge-system__evidence-card bridge-system__evidence-card--${group.status}`}><span>{group.label}</span><ul>{group.items.map(item=><li key={item}>{item}</li>)}</ul></article>)}</div>
    </section>

    <section className="bridge-system__future" aria-labelledby="bridge-future-title">
      <figure><img src="/portfolio/bridge-academy-hero.png" alt="Bridge Academy planning workbench with curriculum, music hardware, computing, electronics, historical material, and diagrams"/><figcaption>PLANNING ARCHIVE / CURRICULUM, MUSIC, TECHNOLOGY, CULTURE, AND CAREER PATHWAYS</figcaption></figure>
      <div><span>05 / FUTURE FLAGSHIP CAMPUS</span><h3 id="bridge-future-title">Digital first.<br/><em>Place follows proof.</em></h3><p>The physical-school vision remains part of Bridge Academy, but it is not the starting claim. A flagship creative-technology campus belongs at the end of a demonstrated path—not at the beginning of the story.</p>
        <ol><li><b>01</b><span>Digital first</span></li><li><b>02</b><span>Controlled pilots</span></li><li><b>03</b><span>Distributed programs / partners</span></li><li><b>04</b><span>Flagship campus</span></li></ol>
      </div>
    </section>

    <footer className="bridge-system__footer"><div><span>BRIDGE ACADEMY</span><strong>{project.hook}</strong></div><p>Proposed educational system · no operating school, enrolled cohorts, formal partners, or measured outcomes are implied.</p></footer>
  </section>
}
