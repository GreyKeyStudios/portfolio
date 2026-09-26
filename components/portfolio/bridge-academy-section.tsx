import type { PortfolioProject } from "@/lib/portfolio-projects"

const pillars = [
  { name: "Music", detail: "History, theory, production, recording, sampling, synthesis, and finished creative work." },
  { name: "STEM", detail: "Physics, acoustics, electronics, computing, networking, and programming made tangible." },
  { name: "Culture", detail: "The people, places, movements, and technology behind recorded and popular music." },
  { name: "Entrepreneurship", detail: "Publishing, ownership, financial literacy, release strategy, and economic pathways." },
]

const evolution = [
  ["01", "History of Beats", "A music-history and technology curriculum grounded in the evolution of recorded music, particularly Black American music."],
  ["02", "Build what you use", "The curriculum became a workshop: computers, servers, MIDI hardware, plugins, websites, and synthesizers."],
  ["03", "Bridge Academy", "The idea expanded into an interdisciplinary youth education system connecting music, STEM, culture, and entrepreneurship."],
  ["04", "ReLearn", "The educational thinking became a working digital learning engine with structured courses, practice, review, and interactive tools."],
]

const learningSpine = ["History", "Fundamentals", "Technology", "Hands-on construction", "Creative application", "Finished work", "Career / economic pathway"]

const workshop = [
  ["01", "Build the course computers", "Hardware becomes the first lesson—not an invisible appliance."],
  ["02", "Configure a file or cloud server", "Storage, networking, collaboration, and digital infrastructure become practical."],
  ["03", "Program a VST or audio plugin", "Code is connected directly to sound, signal flow, and creative decisions."],
  ["04", "Design and publish a website", "Students turn an idea into a public, usable digital artifact."],
  ["05", "Build a MIDI controller", "Electronics, interface design, and performance meet in one physical object."],
  ["06", "Create music-to-video synchronization", "Timing, editing, storytelling, and technical precision converge."],
  ["07", "Code a software synthesizer", "Waveforms, acoustics, mathematics, and programming become an instrument."],
  ["08", "Produce and release finished work", "Recording, sampling, synthesis, theory, identity, ownership, and business complete the loop."],
]

const connections = [
  ["Music production", "Acoustics + physics"],
  ["MIDI", "Electronics + programming"],
  ["DAWs", "Computing + digital systems"],
  ["Websites", "Coding + communication"],
  ["Studios", "Networking + infrastructure"],
  ["Releasing music", "Entrepreneurship + financial literacy"],
]

const artifacts = [
  ["History of Beats", "CURRICULUM ORIGIN", "The historical and cultural foundation of the original program."],
  ["Seven-project STEM curriculum", "HANDS-ON SEQUENCE", "A project-based route from hardware and networks to code and creative tools."],
  ["FL Studio curriculum", "PRODUCTION PATHWAY", "A structured route through recording, arrangement, sampling, synthesis, and finishing work."],
  ["Bridge Learning Standard", "SYSTEM DESIGN", "The shared learning model connecting context, fundamentals, construction, application, and outcomes."],
]

const built = [
  "Multi-year concept evolution and planning",
  "Curriculum architecture and lesson ideas",
  "Hands-on project and module plans",
  "Research and planning archive",
  "Bridge Learning Standard",
  "Working ReLearn learning engine and interactive prototypes",
]

const proposed = [
  "A physical Twin Cities program and creative technology lab",
  "Enrolled youth cohorts and instructors",
  "Formal staffing, board, and community partnerships",
  "A nonprofit or Stonebridge operating entity",
  "Funding, accreditation, and measured outcomes",
  "Completion of the full multidisciplinary curriculum",
]

function ArtworkSlot({ label, detail, ratio = "wide" }: { label: string; detail: string; ratio?: "wide" | "square" }) {
  return <div className={`bridge-art-slot bridge-art-slot--${ratio}`} role="img" aria-label={`${label}. ${detail}`}>
    <div className="bridge-art-slot__grid" aria-hidden="true"><i/><i/><i/><i/></div>
    <span>FINAL ARTWORK IN PROGRESS</span>
    <strong>{label}</strong>
    <small>{detail}</small>
  </div>
}

export function BridgeAcademySection({ project }: { project: PortfolioProject }) {
  return <section className="bridge-case" id="bridge" aria-labelledby="bridge-title">
    <header className="bridge-case__hero">
      <div className="bridge-case__hero-copy">
        <div className="bridge-case__meta"><span>09 / EDUCATION SYSTEM</span><b><i/>PROPOSED PROGRAM</b></div>
        <h2 id="bridge-title">BRIDGE<br/><em>ACADEMY</em></h2>
        <p className="bridge-case__thesis">From curiosity to capability to career.</p>
        <p className="bridge-case__dek">A proposed Twin Cities youth education program connecting music, STEM, culture, and entrepreneurship through hands-on learning.</p>
        <div className="bridge-case__pillars-inline" aria-label="Bridge Academy pillars">{pillars.map((pillar)=><span key={pillar.name}>{pillar.name}</span>)}</div>
      </div>
      <figure className="bridge-case__hero-art">
        <img src="/portfolio/bridge-academy-hero.png" alt="Bridge Academy planning workbench with music-history books, curriculum diagrams, MIDI hardware, a production workstation, electronics, and Minneapolis archival material"/>
        <figcaption><span>PLANNING WORKBENCH</span><small>Concept visualization · curriculum, music, technology, culture, and career pathways</small></figcaption>
      </figure>
    </header>

    <div className="bridge-case__truth"><p><span>CASE STUDY, NOT AN OPERATING SCHOOL</span> Bridge Academy is presented here as curriculum design, research, planning, and prototype work. ReLearn is the working digital extension of that educational thinking.</p></div>

    <section className="bridge-case__pillars" aria-labelledby="bridge-pillars-title">
      <header><span>01 / THE FOUR PIERS</span><h3 id="bridge-pillars-title">One bridge.<br/><em>Four disciplines.</em></h3></header>
      <div>{pillars.map((pillar,index)=><article key={pillar.name}><span>0{index+1}</span><h4>{pillar.name}</h4><p>{pillar.detail}</p><i aria-hidden="true"/></article>)}</div>
    </section>

    <section className="bridge-case__evolution" aria-labelledby="bridge-evolution-title">
      <header><span>02 / EVOLUTION</span><h3 id="bridge-evolution-title">The idea kept<br/><em>getting wider.</em></h3><p>The project did not begin as a generalized education concept. Each expansion followed a problem discovered in the layer before it.</p></header>
      <ol>{evolution.map(([number,title,copy])=><li key={number}><span>{number}</span><div><h4>{title}</h4><p>{copy}</p></div></li>)}</ol>
    </section>

    <section className="bridge-case__spine" aria-labelledby="bridge-spine-title">
      <header><span>03 / LEARNING MODEL</span><h3 id="bridge-spine-title">Context before tools.<br/><em>Work before credentials.</em></h3></header>
      <ol>{learningSpine.map((item,index)=><li key={item}><span>{String(index+1).padStart(2,"0")}</span><b>{item}</b>{index<learningSpine.length-1&&<i aria-hidden="true">→</i>}</li>)}</ol>
    </section>

    <section className="bridge-case__workshop" aria-labelledby="bridge-workshop-title">
      <header><span>04 / HANDS-ON CONSTRUCTION</span><h3 id="bridge-workshop-title">The lab is not<br/><em>the backdrop.</em></h3><p>Students would learn technology by constructing the systems and tools used to make the work.</p></header>
      <div>{workshop.map(([number,title,copy])=><article key={number}><span>{number}</span><h4>{title}</h4><p>{copy}</p></article>)}</div>
    </section>

    <section className="bridge-case__connections" aria-labelledby="bridge-connections-title">
      <header><span>05 / CONNECTED DISCIPLINES</span><h3 id="bridge-connections-title">Every creative act<br/><em>opens another door.</em></h3></header>
      <div className="bridge-case__connection-map">{connections.map(([from,to])=><div key={from}><b>{from}</b><span aria-hidden="true"/><strong>{to}</strong></div>)}</div>
    </section>

    <section className="bridge-case__evidence" aria-labelledby="bridge-evidence-title">
      <header><span>06 / EVIDENCE OF THE WORK</span><h3 id="bridge-evidence-title">A concept with<br/><em>receipts.</em></h3><p>The archive shows how the thinking developed; ReLearn demonstrates how part of it behaves as software.</p></header>
      <div className="bridge-case__artifacts">
        {artifacts.map(([title,label,copy],index)=><article key={title}><span>{label}</span><strong>{title}</strong><p>{copy}</p><small>ARTIFACT PREVIEW · COMING</small><i aria-hidden="true">0{index+1}</i></article>)}
      </div>
      <article className="bridge-case__relearn">
        <div className="bridge-case__relearn-copy"><span>WORKING DIGITAL EXTENSION</span><h4>ReLearn</h4><p>A working learning engine that carries Bridge Academy’s emphasis on structured curriculum, practice, review, mastery, and interactive tools into the browser.</p><ul><li>Structured courses and lessons</li><li>Quizzes, drills, and review</li><li>Progress and mastery systems</li><li>Interactive music-learning prototypes</li></ul><a href="https://rltest.greykeystudios.dev/" target="_blank" rel="noreferrer">Explore the working preview <b>↗</b></a></div>
        <div className="bridge-case__relearn-media"><div className="bridge-case__desktop"><img src="/portfolio/relearn.png" alt="ReLearn course list interface"/></div><div className="bridge-case__mobile"><img src="/portfolio/relearn-mobile.png" alt="ReLearn mobile course interface"/></div><small>REAL PRODUCT CAPTURES · DESKTOP + MOBILE</small></div>
      </article>
      <div className="bridge-case__prototype-grid"><ArtworkSlot label="PIANO FOUNDATIONS" detail="Interactive lesson and MIDI practice artifact"/><ArtworkSlot label="RELEARN SYNTH" detail="Sound-synthesis teaching instrument and signal architecture"/></div>
    </section>

    <section className="bridge-case__status" aria-labelledby="bridge-status-title">
      <header><span>07 / CURRENT STATUS</span><h3 id="bridge-status-title">Honest about<br/><em>the distance.</em></h3></header>
      <div className="bridge-case__status-grid"><article><span>DESIGNED OR BUILT</span><ul>{built.map(item=><li key={item}>{item}</li>)}</ul></article><article><span>PROPOSED NEXT</span><ul>{proposed.map(item=><li key={item}>{item}</li>)}</ul></article></div>
      <footer><div><span>BRIDGE ACADEMY</span><strong>{project.hook}</strong></div><p>The ambition is large. The portfolio claim is precise.</p></footer>
    </section>
  </section>
}
