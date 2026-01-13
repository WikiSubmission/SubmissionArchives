'use server';



// --- TYPES ---

export interface MediaItem {
  type: 'youtube' | 'video' | 'book';
  url?: string;
  title: string;
  timestamp?: number; // Seconds
  citation?: string;
}

export interface StudyEntry {
  id: string;
  verse_ref: string; // "NT:Matthew:5:1"
  title?: string;
  content: string; // Markdown/HTML
  media_content: MediaItem[];
  cross_refs: string[];
}

// --- DATABASE CLIENT ---
// --- DATABASE CLIENT ---
// Removed Supabase client


// --- LOCAL DATA OVERRIDES ---

const localStudyEntries: StudyEntry[] = [
  {
    id: 'local-matt-1-23-virgin-prophecy',
    verse_ref: 'NT:Matthew:1:23',
    title: 'Exegesis: The Virgin Prophecy',
    content: `
<div class="space-y-6">
  <div class="bg-blue-50 p-4 border-l-4 border-blue-500 rounded-r-lg">
    <strong class="block text-blue-900 text-sm mb-2">Virgin vs. Young Woman (Almah/Parthenos)</strong>
    <p class="text-sm text-blue-800 mb-2">Matthew's citation relies on the Greek Septuagint (LXX) translation of Isaiah 7:14. The original Hebrew uses <em>almah</em>, meaning "young woman" (of marriageable age), which carries no necessary implication of virginity. The LXX translated this as <em>parthenos</em> ("virgin").</p>
    <p class="text-sm text-blue-800 mb-2">In Isaiah's historical context (735 BCE), the "sign" was a message to King Ahaz: a young woman (likely in the royal court) would conceive naturally, and before that child ("Immanuel") grew up, the threat from Syria and Israel would be destroyed. It was a promise of immediate political deliverance, not a distant messianic prediction.</p>
    <p class="text-sm text-blue-800">Matthew, reading the Greek Bible, sees the word "virgin" and finds a "fulfillment" for the virgin birth tradition. This is a classic example of how early Christians read the OT through the lens of the Septuagint to construct messianic proofs.</p>
  </div>
</div>
    `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-2-1-magi',
    verse_ref: 'NT:Matthew:2:1',
    title: 'Exegesis: The Magi & Bethlehem',
    content: `
<div class="space-y-8">
  <!-- SECTION 1: THE MAGI -->
  <section>
    <div class="flex items-center gap-2 mb-4">
       <span class="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">Theme 1</span>
       <h3 class="text-xl font-bold text-gray-900">The Magi and Zoroastrian Prophecy</h3>
    </div>

    <div class="mb-6 p-4 bg-gray-50 border-l-4 border-amber-600 rounded-r-lg shadow-sm">
      <div class="flex items-start gap-3">
        <div class="mt-1 min-w-[3rem]">
            <span class="block text-sm font-bold text-gray-500 uppercase tracking-wider">Greek</span>
            <span class="block text-lg font-serif italic text-gray-900">magoi</span>
        </div>
        <div>
           <strong class="block text-gray-900 text-sm mb-1">Definition & Context</strong>
           <p class="text-sm text-gray-700 leading-relaxed">
             Matthew’s “wise men” are called <em>μάγοι</em> (magoi), a term denoting the <strong>Persian priestly class</strong> connected with Zoroastrian ritual, dream interpretation, and celestial observation. They were not generic astrologers but religious specialists who anticipated the <em>Saoshyant</em>—a world-renewing savior.
           </p>
        </div>
      </div>
    </div>

    <div class="prose prose-sm max-w-none text-gray-600 leading-relaxed">
      <p>
        Matthew is uniquely concerned with portraying Jesus as the fulfillment of prophecy. Unlike other citations tied to Jewish text, the Magi episode introduces foreign priests recognizing a royal birth through a celestial sign. This invokes a non-Jewish prophetic horizon:
      </p>
      <ul class="my-4 space-y-2 list-none pl-0">
        <li class="flex gap-2">
           <span class="text-amber-600 font-bold">•</span>
           <span><strong>Cosmic Sign:</strong> Zoroastrian priests were watchers of the heavens; a star announcing a righteous king carried profound eschatological meaning.</span>
        </li>
        <li class="flex gap-2">
           <span class="text-amber-600 font-bold">•</span>
           <span><strong>Universal Homage:</strong> By depicting Persian priests bowing before Jesus, Matthew signals that Israel's Messiah answers a broader, ancient expectation for a world-renewing savior.</span>
        </li>
      </ul>
    </div>
  </section>

  <hr class="border-gray-200" />

  <!-- SECTION 2: BETHLEHEM -->
  <section>
    <div class="flex items-center gap-2 mb-4">
       <span class="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">Theme 2</span>
       <h3 class="text-xl font-bold text-gray-900">Bethlehem: Theology over History?</h3>
    </div>

    <p class="mb-4 text-gray-700 text-sm leading-relaxed">
      The statement “Jesus was born in Bethlehem of Judea” is not merely geographical biographical data; it is a theological claim connecting Jesus to the Davidic covenant.
    </p>

    <div class="grid grid-cols-1 gap-6 mb-6">
       <!-- Prophecy Card -->
       <div class="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
             <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
             Prophetic Mandate
          </h4>
          <blockquote class="text-gray-900 italic font-serif text-lg mb-2">
            “But thou, Bethlehem Ephratah... out of thee shall he come forth unto me that is to be ruler in Israel...”
          </blockquote>
          <cite class="text-xs text-blue-600 font-bold not-italic">— Micah 5:2</cite>
       </div>

       <!-- Scholarly Context Card -->
       <div class="bg-blue-50/50 p-5 rounded-lg border border-blue-100">
          <h4 class="text-xs font-bold text-blue-800 uppercase tracking-wider mb-3">Scholarly Consensus</h4>
          <p class="text-sm text-gray-700 mb-2">
            <strong>Raymond Brown & Bart Ehrman</strong> argue that Matthew and Luke intentionally shape their narratives to ensure a Bethlehem birth, despite contradicting historical details:
          </p>
          <ul class="text-xs space-y-2 text-gray-600">
            <li class="flex justify-between border-b border-blue-200 pb-1">
               <span><strong>Matthew:</strong></span>
               <span class="italic">Family <strong>lives</strong> in Bethlehem; flees to Egypt; later moves to Nazareth.</span>
            </li>
            <li class="flex justify-between pt-1">
               <span><strong>Luke:</strong></span>
               <span class="italic">Family <strong>lives</strong> in Nazareth; travels to Bethlehem for census; returns.</span>
            </li>
          </ul>
       </div>
    </div>

    <p class="text-sm text-gray-600 leading-relaxed italic">
       "Both Gospels emphasize Bethlehem because it is seen as essential for fulfilling the messianic expectation, yet they differ in how they tell the story—highlighting theological aims over strict historical consistency."
    </p>
  </section>
</div>
`,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-2-2-born-king',
    verse_ref: 'NT:Matthew:2:2',
    title: 'Exegesis: "Born King" & The Star',
    content: `
<div class="space-y-6">
  <div class="bg-gray-50 p-4 border-l-4 border-gray-600 rounded-r-lg">
    <strong class="block text-gray-900 text-sm mb-2">Historical-Critical Analysis</strong>
    <p class="text-sm text-gray-700 mb-2">The phrase "born King" is historically odd—kings are made through coronation, succession, or conquest, not born. This suggests Matthew is constructing a theological claim rather than recording historical speech.</p>
    <p class="text-sm text-gray-700">The Magis' identification of a "King of the Jews" based solely on astronomy strains credulity. How would a star indicate specifically a <em>Jewish</em> king rather than any significant ruler? Matthew provides no mechanism for this interpretation.</p>
  </div>

  <div class="bg-red-50 p-4 border-l-4 border-red-500 rounded-r-lg">
    <strong class="block text-red-900 text-sm mb-2">The Priestly vs. Royal Messiah</strong>
    <p class="text-sm text-red-800 mb-2">The Dead Sea Scrolls reveal that Second Temple Judaism often expected two Messiahs: a <strong>Messiah of Aaron</strong> (Priestly) to appear before or alongside a Messiah of Israel (Royal). If Jesus was of Mary's Aaronic lineage—as evidence and the Quran suggest—this "King of the Jews" framing is Matthew's theological construction to retrofit a priestly-prophetic figure into a Davidic royal framework.</p>
  </div>

  <div class="bg-blue-50 p-4 border-l-4 border-blue-500 rounded-r-lg">
    <strong class="block text-blue-900 text-sm mb-2">Literary Parallels</strong>
    <p class="text-sm text-blue-800">The star motif parallels ancient Near Eastern literature where celestial phenomena herald royal births (e.g., Suetonius on Augustus). Matthew likely utilizes this widespread convention to elevate Jesus's status in culturally understood terms, rather than reporting a historical astronomical event.</p>
  </div>
</div>
        `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-2-3-herod-troubled',
    verse_ref: 'NT:Matthew:2:3',
    title: 'Exegesis: Herod & "All Jerusalem"',
    content: `
<div class="space-y-6">
  <p class="text-sm text-gray-700">Herod's anxiety is historically plausible given his paranoia (he killed his own sons). However:</p>
  
  <div class="bg-gray-50 p-4 border-l-4 border-gray-600 rounded-r-lg">
    <strong class="block text-gray-900 text-sm mb-2">Hyperbolic Polemic</strong>
    <p class="text-sm text-gray-700 mb-2">The claim that <strong>"all Jerusalem"</strong> was troubled is Matthew's hyperbolic expansion. If a Messiah appeared, Jerusalem's response would likely be curiosity or hope, not universal distress.</p>
    <p class="text-sm text-gray-700">This serves Matthew's anachronistic anti-Jewish polemic: by aligning Jerusalem with the Idumean usurper Herod, he foreshadows the later rejection of Jesus by Jewish authorities.</p>
  </div>
  
  <div class="bg-blue-50 p-4 border-l-4 border-blue-500 rounded-r-lg">
    <strong class="block text-blue-900 text-sm mb-2">Argument from Silence</strong>
    <p class="text-sm text-blue-800">Josephus documented numerous messianic movements and pretenders during this period, yet mentions <strong>nothing</strong> about Bethlehem or Herod's concern over a child there. This silence suggests Matthew is creating a narrative to serve his theological purpose: establishing Jesus as fulfilling Scripture, even if it requires bending historical plausibility.</p>
  </div>
</div>
        `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-2-4-priests-scribes',
    verse_ref: 'NT:Matthew:2:4',
    title: 'Exegesis: The Indifferent Establishment',
    content: `
<div class="space-y-6">
  <p class="text-sm text-gray-700">Matthew portrays the chief priests and scribes as possessing scriptural knowledge but lacking spiritual perception. They know <em>where</em> but do not go to worship.</p>

  <div class="bg-blue-50 p-4 border-l-4 border-blue-500 rounded-r-lg">
    <strong class="block text-blue-900 text-sm mb-2">Literary Device</strong>
    <p class="text-sm text-blue-800 mb-2">Historically, would Herod really convene "all" chief priests for this? This is an exaggeration to indict the Jewish religious establishment collectively. The scene emphasizes the irony that Gentile Magi recognize Jesus while Jewish leaders remain indifferent.</p>
  </div>

  <div class="bg-red-50 p-4 border-l-4 border-red-500 rounded-r-lg">
    <strong class="block text-red-900 text-sm mb-2">Theological Interpretation</strong>
    <p class="text-sm text-red-800">Matthew's assumption that "the Christ" would be born in a single prophesied location reflects later Christian development. First-century expectations were diverse (two messiahs at Qumran, etc.). Matthew simplifies this landscape to present a singular, scripturally-determined Davidic messiah. If Jesus was the Aaronic messiah, this entire scene represents forcing him into a Davidic mold.</p>
  </div>
</div>
        `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-2-5-bethlehem-prophecy',
    verse_ref: 'NT:Matthew:2:5',
    title: 'Exegesis: Constructing Bethlehem',
    content: `
<div class="space-y-6">
  <div class="bg-gray-50 p-4 border-l-4 border-gray-600 rounded-r-lg">
    <strong class="block text-gray-900 text-sm mb-2">Contradictory Narratives</strong>
    <p class="text-sm text-gray-700 mb-2">Was Jesus actually born in Bethlehem? Matthew and Luke rely on mutually exclusive mechanisms to place him there (Matthew: Joseph lives there; Luke: Census travel). John 7:41-42 records objections that Jesus is from Galilee, which John never corrects.</p>
    <p class="text-sm text-gray-700">It is more historically likely that Jesus was "Jesus of Nazareth" by birth, and the Bethlehem tradition is a theological construction to satisfy Micah 5:2.</p>
  </div>

  <div class="bg-red-50 p-4 border-l-4 border-red-500 rounded-r-lg">
    <strong class="block text-red-900 text-sm mb-2">Irrelevance to Aaronic Messiah</strong>
    <p class="text-sm text-red-800">If Jesus was the <strong>Aaronic (Priestly) Messiah</strong>, the Davidic city of Bethlehem is irrelevant. The Dead Sea Scrolls place the Aaronic messiah in contexts of teaching and spiritual leadership, not Davidic geography. Matthew's insistence on Bethlehem is part of recasting the priestly Jesus as a Davidic royal figure.</p>
  </div>
</div>
        `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-2-6-micah-modified',
    verse_ref: 'NT:Matthew:2:6',
    title: 'Exegesis: Editing the Prophet',
    content: `
<div class="space-y-6">
  <div class="bg-amber-50 p-4 border-l-4 border-amber-600 rounded-r-lg">
    <strong class="block text-amber-900 text-sm mb-2">Theological Rewriting</strong>
    <p class="text-sm text-amber-800 mb-2">Matthew's quotation modifies Micah 5:2 significantly. He changes "though you are small" to <strong>"in no way least"</strong>—reversing the meaning to emphasize significance. He clarifies "shepherd my people" by conflating it with 2 Samuel 5:2.</p>
    <p class="text-sm text-amber-800">This pattern of modifying scripture to fit the narrative raises questions about historical accuracy. Matthew adjusts prophecies to make the "messianic script" work.</p>
  </div>

  <div class="bg-red-50 p-4 border-l-4 border-red-500 rounded-r-lg">
    <strong class="block text-red-900 text-sm mb-2">Governor vs. Teacher</strong>
    <p class="text-sm text-red-800">The term <em>hegemon</em> ("governor") suggests political, Davidic authority. This misrepresents the Aaronic messiah, whom the Dead Sea Scrolls describe as a Teacher of Righteousness leading people to repentance, not a political ruler.</p>
  </div>
</div>
        `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-2-7-secret-meeting',
    verse_ref: 'NT:Matthew:2:7',
    title: 'Exegesis: The Star & Moses Typology',
    content: `
<div class="space-y-6">
  <div class="bg-gray-50 p-4 border-l-4 border-gray-600 rounded-r-lg">
    <strong class="block text-gray-900 text-sm mb-2">Narrative Suspense vs. History</strong>
    <p class="text-sm text-gray-700 mb-2">The "secret" meeting raises questions: if the star was bright enough to guide travelers, why did Herod need ot ask the Magi about its timing? This suggests the "star" is a literary device.</p>
    <p class="text-sm text-gray-700">The timing inquiry allows Herod to calculate the Massacre of the Innocents (v16), creating a parallel to Pharaoh/Moses. This is <strong>typology</strong>—positioning Jesus as a new Moses—rather than history.</p>
  </div>

  <div class="bg-red-50 p-4 border-l-4 border-red-500 rounded-r-lg">
    <strong class="block text-red-900 text-sm mb-2">The Aaronic Perspective</strong>
    <p class="text-sm text-red-800">The Aaronic messiah wasn't expected to be a political threat requiring assassination. The Herodian threat narrative only makes sense if Matthew is forcing Jesus into a Davidic royal framework where political power is at stake.</p>
  </div>
</div>
        `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-2-8-deceptive-worship',
    verse_ref: 'NT:Matthew:2:8',
    title: 'Exegesis: Worship or Respect?',
    content: `
<div class="space-y-6">
  <p class="text-sm text-gray-700 mb-2">Herod's command creates dramatic irony—he asks to "worship" while intending to kill.</p>

  <div class="bg-red-50 p-4 border-l-4 border-red-500 rounded-r-lg">
    <strong class="block text-red-900 text-sm mb-2">Christology vs. Monotheism</strong>
    <p class="text-sm text-red-800 mb-2">In Matthew, worship (<em>proskuneo</em>) of Jesus begins at birth. Historical Jesus studies suggest divine status emerged gradually. If Jesus was the Aaronic messiah (a human prophet), divine worship is inappropriate.</p>
    <p class="text-sm text-red-800">The Quran (5:75, 5:116-117) aligns with the Aaronic view, insisting Jesus was a messenger, not divine, and that worship is for God alone.</p>
  </div>

  <div class="bg-blue-50 p-4 border-l-4 border-blue-500 rounded-r-lg">
    <strong class="block text-blue-900 text-sm mb-2">Narrative Logic</strong>
    <p class="text-sm text-blue-800">Would Herod really rely on foreign visitors to find a threat to his throne instead of sending his own agents? The narrative serves theology, not historical verisimilitude.</p>
  </div>
</div>
        `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-2-9-cosmic-spotlight',
    verse_ref: 'NT:Matthew:2:9',
    title: 'Exegesis: The Stopping Star',
    content: `
<div class="space-y-6">
  <div class="bg-gray-50 p-4 border-l-4 border-gray-600 rounded-r-lg">
    <strong class="block text-gray-900 text-sm mb-2">Physically Impossible</strong>
    <p class="text-sm text-gray-700 mb-2">No natural celestial object moves across the sky and then stops to "hover" over a specific house. This confirms the star is a <strong>theological symbol</strong> of divine guidance.</p>
    <p class="text-sm text-gray-700">The "cosmic spotlight" effect is typical of Matthew's apocalyptic symbolism (like the earthquakes and darkness later). It is notably absent from Luke's angel-centric account.</p>
  </div>

  <div class="bg-amber-50 p-4 border-l-4 border-amber-600 rounded-r-lg">
    <strong class="block text-amber-900 text-sm mb-2">Quranic Perspective</strong>
    <p class="text-sm text-amber-800">The Quranic account of Jesus includes no star or Magi. It focuses on Mary's piety and Jesus's prophetic speech. The "cosmic fanfare" in Matthew is likely theological embellishment to establish Davidic status for a Gentile audience.</p>
  </div>
</div>
        `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-2-10-joy',
    verse_ref: 'NT:Matthew:2:10',
    title: 'Exegesis: Hyperbolic Joy',
    content: `
<div class="space-y-6">
  <p class="text-sm text-gray-700 mb-2">"Rejoiced with exceedingly great joy" (literally "rejoiced with great joy greatly") is stylistic hyperbole.</p>

  <div class="bg-blue-50 p-4 border-l-4 border-blue-500 rounded-r-lg">
    <strong class="block text-blue-900 text-sm mb-2">Gentile Inclusion</strong>
    <p class="text-sm text-blue-800 mb-2">This emphasizes the theme of <strong>Gentile inclusion</strong>: outsiders find the Messiah while the "sons of the kingdom" (verse 3) are troubled. This reflects later church tensions with Judaism, read back into the infancy narrative (cf. Matt 8:11-12).</p>
    <p class="text-sm text-blue-800">The irony is sharp: Jewish sectarians (Essene/Qumran) were actively expecting a Priestly Messiah, yet Matthew portrays foreign astrologers as the first to recognize him.</p>
  </div>
</div>
        `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-2-11-gifts',
    verse_ref: 'NT:Matthew:2:11',
    title: 'Exegesis: House, Worship, & Gifts',
    content: `
<div class="space-y-6">
  <div class="bg-gray-50 p-4 border-l-4 border-gray-600 rounded-r-lg">
    <strong class="block text-gray-900 text-sm mb-2">House vs. Manger</strong>
    <p class="text-sm text-gray-700">They enter a "house" (<em>oikia</em>), contradicting Luke's manger. In Matthew, the Holy Family lives in Bethlehem; in Luke, they are visitors. These are independent, incompatible traditions.</p>
  </div>

  <div class="bg-amber-50 p-4 border-l-4 border-amber-600 rounded-r-lg">
    <strong class="block text-amber-900 text-sm mb-2">Symbolic Gifts & Identity</strong>
    <ul class="list-disc pl-4 text-sm text-amber-800 space-y-1 mb-2">
      <li><strong>Gold:</strong> Royalty (Davidic claim).</li>
      <li><strong>Frankincense:</strong> Priesthood (Temple worship).</li>
      <li><strong>Myrrh:</strong> Death/Burial.</li>
    </ul>
    <p class="text-sm text-amber-800">Ironically, while emphasizing royal gold, the <strong>frankincense</strong> points to the Priestly (Aaronic) identity Matthew is otherwise trying to obscure. These gifts are likely symbolic theological additions rather than historical events.</p>
  </div>

  <div class="bg-red-50 p-4 border-l-4 border-red-500 rounded-r-lg">
    <strong class="block text-red-900 text-sm mb-2">The Worship Problem</strong>
    <p class="text-sm text-red-800">Worship (<em>proskuneo</em>) here implies divinity in Matthew's developed Christology. For an Aaronic prophet-messiah, such worship would be inappropriate, and the Quran forbids it.</p>
  </div>
</div>
        `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-2-12-dream-warning',
    verse_ref: 'NT:Matthew:2:12',
    title: 'Exegesis: Divine Intervention',
    content: `
<div class="space-y-6">
  <p class="text-sm text-gray-700 mb-2">Dreams are a recurring Matthean motif (5 times in the infancy narrative) to show divine guidance. This is a common ancient literary device.</p>
  
  <div class="bg-blue-50 p-4 border-l-4 border-blue-500 rounded-r-lg">
    <strong class="block text-blue-900 text-sm mb-2">Theodicy Question</strong>
    <p class="text-sm text-blue-800 mb-2">The warning allows the Magi to escape, protecting Jesus. However, this creates a theodicy problem: If God can warn the Magi, why doesn't He warn the families of the "Innocents" Herod is about to massacre (v16)? The selective intervention serves the narrative (Moses typology) but leaves theological gaps.</p>
  </div>

  <p class="text-sm text-gray-600 italic border-t pt-4 mt-4">"Matthew's account is thus theologically motivated historical fiction, brilliantly crafted to make theological arguments but not reliable as historical biography."</p>
</div>
        `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-2-13-flight-egypt',
    verse_ref: 'NT:Matthew:2:13',
    title: 'Exegesis: Divine Guidance & Moses Typology',
    content: `
<div class="space-y-6">
  <p class="text-sm text-gray-700 mb-2">The instruction to flee to Egypt is historically plausible (large Jewish community there), but its literary function transcends history.</p>

  <div class="bg-blue-50 p-4 border-l-4 border-blue-500 rounded-r-lg">
    <strong class="block text-blue-900 text-sm mb-2">Moses Typology & Deuteronomy 18:15</strong>
    <p class="text-sm text-blue-800 mb-2">Matthew constructs a deliberate parallel: Pharaoh/Herod massacre, Moses/Jesus escape. This establishes Jesus as the <strong>"prophet like Moses"</strong> anticipated in Deuteronomy 18:15 ("The Lord will raise up a prophet like me...").</p>
    <p class="text-sm text-blue-800">Use of this typology ironically supports an <strong>Aaronic (Priestly)</strong> framework: Moses was a Levite, and the Dead Sea Scrolls expected the Aaronic Messiah to be a "prophet like Moses" who teaches with divine authority—unlike the Davidic royal warrior.</p>
  </div>

  <div class="bg-gray-50 p-4 border-l-4 border-gray-600 rounded-r-lg">
    <strong class="block text-gray-900 text-sm mb-2">"The Child and His Mother"</strong>
    <p class="text-sm text-gray-700">Matthew repeatedly uses this phrase (vv. 13, 14, 20, 21), never "your son." This grammatical distancing reflects the virgin birth claim but undermines the Joseph-based Davidic genealogy.</p>
  </div>
</div>
        `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-2-14-night-flight',
    verse_ref: 'NT:Matthew:2:14',
    title: 'Exegesis: Historical Silence',
    content: `
<div class="space-y-6">
  <div class="bg-red-50 p-4 border-l-4 border-red-500 rounded-r-lg">
    <strong class="block text-red-900 text-sm mb-2">Canonical Contradiction</strong>
    <p class="text-sm text-red-800 mb-2">Luke 2:22-39 describes the Holy Family going to Jerusalem 40 days after birth and then returning <em>directly</em> to Nazareth. There is no chronological room for a flight to Egypt and years-long stay.</p>
    <p class="text-sm text-red-800">Paul and Mark never mention Bethlehem or Egypt. The complete silence of other sources suggests this is Matthew's unique theological construction.</p>
  </div>

  <div class="bg-gray-50 p-4 border-l-4 border-gray-600 rounded-r-lg">
    <strong class="block text-gray-900 text-sm mb-2">Practical Logic</strong>
    <p class="text-sm text-gray-700">How did a poor family finance a formatted journey to Egypt? Matthew's narrative provides a convenient answer: the Magi's gifts (v11). The "suspiciously perfect" literary coherence suggests a constructed narrative.</p>
  </div>
</div>
        `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-2-15-hosea-fulfilled',
    verse_ref: 'NT:Matthew:2:15',
    title: 'Exegesis: "Out of Egypt"',
    content: `
<div class="space-y-6">
  <div class="bg-amber-50 p-4 border-l-4 border-amber-600 rounded-r-lg">
    <strong class="block text-amber-900 text-sm mb-2">Midrashic Fulfillment</strong>
    <p class="text-sm text-amber-800 mb-2">Hosea 11:1 ("Out of Egypt I called my son") is a historical reflection on the Exodus of Israel, not a future prophecy. Matthew reinterprets it typologically: Jesus recapitulates Israel's history.</p>
    <p class="text-sm text-amber-800">If "Son" in Hosea is collective Israel, applying it to Jesus implies he <em>is</em> Israel reduced to one faithful person—consistent with an Aaronic High Priest role (representative of the people).</p>
  </div>

  <div class="bg-blue-50 p-4 border-l-4 border-blue-500 rounded-r-lg">
    <strong class="block text-blue-900 text-sm mb-2">Quranic Perspective</strong>
    <p class="text-sm text-blue-800">The Quran, like Luke, mentions no flight to Egypt. It focuses on Jesus's prophetic ministry in the Holy Land. Matthew's Egypt narrative serves to define Jesus via the Exodus story, a typological goal the Quran does not share.</p>
  </div>
</div>
        `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-2-16-massacre',
    verse_ref: 'NT:Matthew:2:16',
    title: 'Exegesis: The Massacre & Historical Silence',
    content: `
<div class="space-y-6">
  <div class="bg-blue-50 p-4 border-l-4 border-blue-500 rounded-r-lg">
    <strong class="block text-blue-900 text-sm mb-2">Moses Typology Climax</strong>
    <p class="text-sm text-blue-800 mb-2">The parallel is unmistakable: Pharaoh kills Hebrew infants, Moses escapes; Herod kills Judean infants, Jesus escapes. Matthew positions Jesus as the "New Moses" reliving Israel's foundational narrative.</p>
  </div>

  <div class="bg-red-50 p-4 border-l-4 border-red-500 rounded-r-lg">
    <strong class="block text-red-900 text-sm mb-2">Devastating Historical Silence</strong>
    <p class="text-sm text-red-800 mb-2">Josephus documented Herod's atrocities in detail (murdering his wife Mariamne, three sons, etc.). He had every reason to record a massacre of infants linked to messianic claims. His complete silence, along with that of all other ancient sources (Jewish, Roman, Luke), strongly suggests this is a <strong>literary construction</strong>.</p>
    <p class="text-sm text-red-800">Apologetic arguments about Bethlehem's small size fail because Matthew specifies "all the surrounding countryside"—a scope Josephus would not miss.</p>
  </div>

  <div class="bg-gray-50 p-4 border-l-4 border-gray-600 rounded-r-lg">
    <strong class="block text-gray-900 text-sm mb-2">Theodicy & Logic</strong>
    <p class="text-sm text-gray-700 mb-2"><strong>Logic:</strong> "Two years old" implies a long gap since the star appeared, contradicting the rapid narrative flow. The "surrounding countryside" expansion implies absurd paranoia—how would Herod know which villages?</p>
    <p class="text-sm text-gray-700"><strong>Theodicy:</strong> God warns Joseph and the Magi, but provides <em>no warning</em> to the innocent families. The narrative requires collateral damage to complete the typological parallel, raising unaddressed ethical questions.</p>
  </div>
</div>
        `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-2-17-jeremiah-fulfilled',
    verse_ref: 'NT:Matthew:2:17',
    title: 'Exegesis: "Then Was Fulfilled"',
    content: `
<div class="space-y-6">
  <p class="text-sm text-gray-700">The formula "then was fulfilled" signals Matthew's typological method: seeing contemporary events as realizing scriptural patterns.</p>

  <div class="bg-amber-50 p-4 border-l-4 border-amber-600 rounded-r-lg">
    <strong class="block text-amber-900 text-sm mb-2">Strained "Fulfillment"</strong>
    <p class="text-sm text-amber-800 mb-2">Jeremiah 31:15 is poetry about the <strong>Babylonian Exile</strong> (586 BCE), not a future prophecy. Matthew ignores the immediate context of hope ("your children will return," v17) to quote only the lament.</p>
    <p class="text-sm text-amber-800">This is <strong>midrashic interpretation</strong>: finding new meaning in ancient texts regardless of original context. Hosea 11:1 was Exodus; Jeremiah 31:15 was Exile. Matthew treats both history lessons as predictions.</p>
  </div>
</div>
        `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-2-18-rachel-weeping',
    verse_ref: 'NT:Matthew:2:18',
    title: 'Exegesis: Rachel & Tribal Tension',
    content: `
<div class="space-y-6">
  <div class="bg-blue-50 p-4 border-l-4 border-blue-500 rounded-r-lg">
    <strong class="block text-blue-900 text-sm mb-2">Narrative Utility of Grief</strong>
    <p class="text-sm text-blue-800 mb-2">Rachel represents the mothers' inconsolable grief ("she wouldn't be comforted"). This provides the emotional weight for the Moses typology climax.</p>
    <p class="text-sm text-blue-800">Troublingly, the weeping mothers serve as narrative props. Matthew shows no concern for the victims beyond their utility in fulfilling prophecy.</p>
  </div>

  <div class="bg-gray-50 p-4 border-l-4 border-gray-600 rounded-r-lg">
    <strong class="block text-gray-900 text-sm mb-2">Geographical & Tribal Conflation</strong>
    <p class="text-sm text-gray-700 mb-2"><strong>Geography:</strong> Jeremiah's "Ramah" is north (Benjamin); Bethlehem is south (Judah). Matthew conflates them.</p>
    <p class="text-sm text-gray-700"><strong>Tribes:</strong> Rachel is the mother of Benjamin/Joseph (North). By invoking her for a Davidic (Judah) story, Matthew tries to make Jesus legally Davidic but nationally inclusive ("Israel reduced to one").</p>
  </div>

  <div class="bg-amber-50 p-4 border-l-4 border-amber-600 rounded-r-lg">
    <strong class="block text-amber-900 text-sm mb-2">Quranic Contrast</strong>
    <p class="text-sm text-amber-800">The Quranic narrative lacks this "foundational violence." Jesus is established by immediate prophetic signs (speaking from the cradle) and divine vindication, without requiring the death of innocents to prove his status.</p>
  </div>
</div>
        `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-2-19-herod-dead',
    verse_ref: 'NT:Matthew:2:19',
    title: 'Exegesis: Reverse Exodus Typology',
    content: `
<div class="space-y-6">
  <div class="bg-blue-50 p-4 border-l-4 border-blue-500 rounded-r-lg">
    <strong class="block text-blue-900 text-sm mb-2">Detailed Moses Parallel (Exodus 4:19)</strong>
    <p class="text-sm text-blue-800 mb-2">The phrase "when Herod was dead" echoes Exodus 4:19 nearly verbatim ("Go back to Egypt, for all those who wanted to kill you are dead"). This is Matthew's most explicit parallel: Moses fled Pharaoh, Jesus fled Herod.</p>
    <p class="text-sm text-blue-800">The <strong>geographical reversal</strong> is sophisticated: Moses went Egypt → Canaan; Jesus goes Canaan → Egypt → Canaan. Jesus recapitulates Israel's entire journey in reverse and forward motion.</p>
  </div>

  <div class="bg-gray-50 p-4 border-l-4 border-gray-600 rounded-r-lg">
    <strong class="block text-gray-900 text-sm mb-2">Loss of Human Agency</strong>
    <p class="text-sm text-gray-700 mb-2">Joseph never acts independently—he always responds to angelic instruction. This portrayal serves the theological purpose of showing God's sovereign control but removes human agency to the point of implausibility. Would a real person base every major life decision solely on dreams?</p>
  </div>
</div>
        `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-2-20-return-command',
    verse_ref: 'NT:Matthew:2:20',
    title: 'Exegesis: Functional Vagueness',
    content: `
<div class="space-y-6">
  <div class="bg-blue-50 p-4 border-l-4 border-blue-500 rounded-r-lg">
    <strong class="block text-blue-900 text-sm mb-2">Typology Driving Grammar</strong>
    <p class="text-sm text-blue-800 mb-2">The angel says "<strong>those</strong> who sought the child's life" (plural), matching Exodus 4:19 literally, even though only Herod was the threat. The language is driven by typological correspondence rather than narrative accuracy.</p>
  </div>

  <div class="bg-gray-50 p-4 border-l-4 border-gray-600 rounded-r-lg">
    <strong class="block text-gray-900 text-sm mb-2">Geographical Flexibility</strong>
    <p class="text-sm text-gray-700 mb-2">The instruction to return to "the land of Israel" is geographically vague. This vagueness is <strong>functional</strong>: Matthew needs flexibility to explain how Jesus ends up in Nazareth rather than Bethlehem. If the angel had said "return to Bethlehem," the subsequent move to Nazareth would be harder to justify.</p>
  </div>

  <div class="bg-red-50 p-4 border-l-4 border-red-500 rounded-r-lg">
    <strong class="block text-red-900 text-sm mb-2">Genealogical Tension</strong>
    <p class="text-sm text-red-800">The phrase "the young child and his mother" (4th time) maintains the virgin birth distance but undermines Matthew's own genealogical project (Ch 1), which relies on Joseph's Davidic line. Matthew wants to claim Davidic lineage through Joseph while simultaneously denying biological connection—an internal tension.</p>
  </div>
</div>
        `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-2-21-restoration',
    verse_ref: 'NT:Matthew:2:21',
    title: 'Exegesis: Restoration of Israel',
    content: `
<div class="space-y-6">
  <p class="text-sm text-gray-700 mb-2">"He arose and took the young child and his mother, and came into the land of Israel."</p>

  <div class="bg-blue-50 p-4 border-l-4 border-blue-500 rounded-r-lg">
    <strong class="block text-blue-900 text-sm mb-2">"Land of Israel" (gē Israēl)</strong>
    <p class="text-sm text-blue-800 mb-2">This designation appears only here in the NT. It evokes the ancient united kingdom. By using this comprehensive term, Matthew presents Jesus's return as the restoration of <strong>all Israel</strong>, not just one region.</p>
  </div>

  <div class="bg-gray-50 p-4 border-l-4 border-gray-600 rounded-r-lg">
    <strong class="block text-gray-900 text-sm mb-2">Narrative Purpose</strong>
    <p class="text-sm text-gray-700">The compressed narrative ("he arose... and came") focuses purely on the theological movement: Egypt → Israel. Matthew is positioning the pieces for his final solution to the "Nazareth Problem."</p>
  </div>
</div>
        `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-2-22-archelaus-fear',
    verse_ref: 'NT:Matthew:2:22',
    title: 'Exegesis: The Nazareth Problem',
    content: `
<div class="space-y-6">
  <div class="bg-red-50 p-4 border-l-4 border-red-500 rounded-r-lg">
    <strong class="block text-red-900 text-sm mb-2">Awkward Double Motivation</strong>
    <p class="text-sm text-red-800 mb-2">Joseph fears Archelaus (human reasoning) AND receives a "warning in a dream" (divine guidance). Matthew seems unsure whether to credit human prudence or divine direction, so he clumsily includes both.</p>
    <p class="text-sm text-red-800">The proliferation of dreams (7 divine interventions) borders on the comical—every decision requires angelic instruction, revealing strong literary construction.</p>
  </div>

  <div class="bg-gray-50 p-4 border-l-4 border-gray-600 rounded-r-lg">
    <strong class="block text-gray-900 text-sm mb-2">Narrative Gymnastics</strong>
    <p class="text-sm text-gray-700 mb-2">Archelaus was indeed brutal (massacring 3,000 at Passover), but Galilee was ruled by Antipas—another Herodian who later executed John the Baptist. Why was Antipas safe?</p>
    <p class="text-sm text-gray-700"><strong>Real Answer:</strong> Matthew <em>needs</em> Jesus in Galilee because that is his historical home. The "fear of Archelaus" is the narrative bridge connecting the theological Bethlehem birth to the historical Nazareth reality.</p>
  </div>
</div>
        `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-2-23-nazarene-prophecy',
    verse_ref: 'NT:Matthew:2:23',
    title: 'Exegesis: The Missing Prophecy',
    content: `
<div class="space-y-6">
  <div class="bg-amber-50 p-4 border-l-4 border-amber-600 rounded-r-lg">
    <strong class="block text-amber-900 text-sm mb-2">"He shall be called a Nazarene"</strong>
    <p class="text-sm text-amber-800 mb-2"><strong>No such prophecy exists</strong> in the Hebrew Scriptures. This is Matthew's most problematic fulfillment claim.</p>
    <ul class="list-disc pl-4 text-sm text-amber-800 space-y-1">
        <li><strong>Theory 1 (Netzer):</strong> Pun on Isaiah 11:1 ("Branch" = <em>netzer</em>). Creative but linguistically weak (Nazareth comes from <em>netser</em>/guard).</li>
        <li><strong>Theory 2 (Nazirite):</strong> Wordplay on Judges 13 (Samson). Unlikely because Jesus drank wine ("glutton and drunkard" accusation, Matt 11:19).</li>
        <li><strong>Theory 3 (Theme):</strong> General prophetic theme of Messiah being despised ("Can anything good come from Nazareth?"). Plural "prophets" suggests a general theme.</li>
        <li><strong>Theory 4 (Bluff):</strong> Matthew knows Jesus was called "The Nazarene" and simply asserts it fulfills prophecy to validate it, using the specific term <em>Nazoraios</em>.</li>
    </ul>
  </div>

  <div class="bg-blue-50 p-4 border-l-4 border-blue-500 rounded-r-lg">
    <strong class="block text-blue-900 text-sm mb-2">The Elaborate Apologetic</strong>
    <p class="text-sm text-blue-800">Chapter 2 functions as an elaborate apologetic: How can the Davidic Messiah (Bethlehem) be from Galilee?
    <br><strong>Answer:</strong> Born in Bethlehem (Prophecy) → Egypt (Typology) → Nazareth (History). Matthew writes brilliant theology, but it comes at the cost of historical accuracy.</p>
  </div>
</div>
        `,
    media_content: [],
    cross_refs: []
  },
  // --- MATTHEW 3 ---
  {
    id: 'local-matt-3-1-john-intro',
    verse_ref: 'NT:Matthew:3:1',
    title: 'Exegesis: The Priestly Cousin & The Wilderness',
    content: `
<div class="space-y-6">
  <div class="bg-gray-50 p-4 border-l-4 border-gray-600 rounded-r-lg">
    <strong class="block text-gray-900 text-sm mb-2">Temporal Vagueness ("In those days")</strong>
    <p class="text-sm text-gray-700 mb-2">The phrase "in those days" provides no chronological precision—Matthew jumps from Jesus's childhood to John's adult ministry without explanation. This temporal vagueness allows Matthew to skip approximately 25-30 years, moving directly from infancy narratives to the beginning of Jesus's public ministry. The missing years suggest Matthew had no traditions about Jesus's youth, or that such material didn't serve his theological purposes.</p>
  </div>

  <div class="bg-red-50 p-4 border-l-4 border-red-500 rounded-r-lg">
    <strong class="block text-red-900 text-sm mb-2">The Hidden Family Connection</strong>
    <p class="text-sm text-red-800 mb-2">John the Baptist is introduced abruptly, without genealogy or birth narrative in Matthew's account (though Luke 1 provides extensive detail about John's miraculous birth to Zechariah and Elizabeth). This is significant given the family connections: according to Luke 1:36, Mary and Elizabeth were relatives (suggenes), making Jesus and John cousins. Luke 1:39-56 describes Mary visiting Elizabeth during both their pregnancies, and the infants recognizing each other in utero (John leaping in Elizabeth's womb). Additionally, Luke 1:80 states John "grew and became strong in spirit, and he was in the wilderness until the day of his public appearance to Israel."</p>
    <p class="text-sm text-red-800 mb-2">More significantly, the Quran identifies Mary as "sister of Aaron" (Surah 19:28), and Luke 1:5 explicitly states Elizabeth was "a descendant of Aaron." If Mary and Elizabeth were blood relatives, and Elizabeth was Aaronic, this strongly suggests Mary was also from the priestly line. Furthermore, Surah 3:37 describes Zechariah becoming Mary's guardian (kafala), placing her under priestly care and granting her access to the mihrab (sanctuary/prayer chamber). This guardianship relationship meant Mary likely lived with or near Zechariah and Elizabeth's family.</p>
    <p class="text-sm text-red-800">These connections mean Jesus and John almost certainly knew each other before John's baptism of Jesus. They were cousins, from priestly families, with John's father serving as Mary's guardian. The idea that John doesn't recognize Jesus at the baptism (as Matthew 3:13-14 will suggest) strains credibility. Matthew downplays or ignores their family connection to present the baptism as John recognizing Jesus through prophetic insight rather than family knowledge. This serves Matthew's theological agenda but obscures the historical reality of their priestly family network.</p>
  </div>

  <div class="bg-blue-50 p-4 border-l-4 border-blue-500 rounded-r-lg">
    <strong class="block text-blue-900 text-sm mb-2">Wilderness & Second Temple Context</strong>
    <p class="text-sm text-blue-800 mb-2">John's location in "the wilderness of Judea" evokes multiple biblical themes. The wilderness was where Israel wandered for 40 years, where prophets received divine revelation (Moses at Sinai, Elijah at Horeb), and where the Qumran community established their separatist sect. By positioning John in the wilderness, Matthew presents him as continuing Israel's prophetic tradition—a voice outside the corrupted temple system, calling people back to covenant faithfulness.</p>
    <p class="text-sm text-blue-800">The wilderness location also recalls Isaiah 40:3 (which Matthew will quote in verse 3), connecting John to the promised herald who would prepare the way for God's coming. The Dead Sea Scrolls community used this same Isaiah passage to justify their wilderness existence—they saw themselves as preparing the way through scriptural study and righteous living. John's wilderness preaching places him within this broader Second Temple movement of reform and renewal outside established religious institutions.</p>
  </div>
</div>
    `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-3-2-repentance',
    verse_ref: 'NT:Matthew:3:2',
    title: 'Exegesis: Apocalyptic Urgency',
    content: `
<div class="space-y-6">
  <div class="bg-blue-50 p-4 border-l-4 border-blue-500 rounded-r-lg">
    <strong class="block text-blue-900 text-sm mb-2">"Implied Transformation"</strong>
    <p class="text-sm text-blue-800 mb-2">John's message is compressed into a single urgent command: "Repent." The Greek word metanoeō means fundamentally "change your mind," implying a complete reorientation of thinking and behavior. This isn't mere remorse or feeling sorry—it's transformative change in response to impending crisis. John frames repentance as necessary because "the Kingdom of Heaven is at hand" (ēngiken)—has drawn near, is imminent, is about to arrive.</p>
    <p class="text-sm text-blue-800 mb-2">"Kingdom of Heaven" is Matthew's characteristic phrase (appearing 32 times), substituting for "Kingdom of God" found in Mark and Luke. This reflects Jewish reverential avoidance of pronouncing God's name directly. However, the phrase creates ambiguity: does "heaven" refer to God's dwelling place (heavenly realm), or is it a circumlocution for God himself (God's kingdom)? Matthew likely intends both—God's reign breaking into the earthly realm from the heavenly sphere.</p>
  </div>

  <div class="bg-amber-50 p-4 border-l-4 border-amber-600 rounded-r-lg">
    <strong class="block text-amber-900 text-sm mb-2">Priestly Messianism</strong>
    <p class="text-sm text-amber-800 mb-2">John's proclamation assumes an apocalyptic worldview common in Second Temple Judaism: history is divided into two ages—the present evil age dominated by sin, oppression, and foreign rule; and the coming age when God will establish his direct rule, defeat enemies, vindicate the righteous, and restore Israel. John announces this transition is imminent, requiring immediate repentance to avoid judgment.</p>
    <p class="text-sm text-amber-800 mb-2">This apocalyptic urgency connects to the Dead Sea Scrolls' expectations. The Qumran community believed they lived in the "final generation," that the Messiah of Aaron (priestly) and Messiah of Israel (royal) would appear imminently. Their calculations (based on Daniel 9 and their own community history) pointed to the turn of the era—precisely when John and Jesus emerged. John's preaching fits within this broader context of heightened messianic expectation around 27-30 CE.</p>
    <p class="text-sm text-amber-800">Critically, John's message focuses on moral and spiritual preparation—repentance, ethical transformation, producing fruit worthy of repentance (verse 8). This aligns with the Aaronic priestly messiah's expected role: teaching Torah, calling people to covenant faithfulness, reforming corrupt religious practice. John isn't announcing a political-military messiah who will overthrow Rome (the Davidic expectation), but a purifying judge who will separate wheat from chaff (verse 12). This distinction is crucial: John's messianic expectation appears priestly-prophetic rather than royal-political.</p>
  </div>
</div>
    `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-3-3-isaiah-voice',
    verse_ref: 'NT:Matthew:3:3',
    title: 'Exegesis: Re-punctuating Isaiah',
    content: `
<div class="space-y-6">
  <div class="bg-gray-50 p-4 border-l-4 border-gray-600 rounded-r-lg">
    <strong class="block text-gray-900 text-sm mb-2">Interpretive Shift (Isaiah 40:3)</strong>
    <p class="text-sm text-gray-700 mb-2">Matthew's first fulfillment quotation in chapter 3 identifies John with the herald promised in Isaiah 40:3. However, examining Isaiah's original context reveals Matthew's interpretive method. Isaiah 40:3 in the Hebrew text reads: "A voice cries out: 'In the wilderness prepare the way of the LORD; make straight in the desert a highway for our God.'"</p>
    <p class="text-sm text-gray-700 mb-2">This passage introduces Second Isaiah's message of comfort to exiles in Babylon (6th century BCE). The voice announces that Israel's suffering is ending, God will return to Jerusalem, and the exiles will process home along a prepared highway through the wilderness. The "way of the LORD" is a literal road for the returning exiles and God's glorious presence. Isaiah is addressing past exile, not predicting a future prophet.</p>
    <p class="text-sm text-gray-700 mb-2">Matthew (following the Septuagint) punctuates differently, creating: "The voice of one crying in the wilderness: 'Prepare the way of the Lord.'" This shifts meaning—the voice itself is in the wilderness (describing John's location), whereas Hebrew syntax has the voice crying out that people should prepare a way in the wilderness (describing where the road should be built). This subtle shift allows Matthew to apply the text to John, but it's interpretive manipulation rather than straightforward fulfillment.</p>
    <p class="text-sm text-gray-700 mb-2">The Qumran community also applied Isaiah 40:3 to themselves (1QS 8:13-14): "When these become members of the Community in Israel according to all these rules, they shall separate from the habitation of unjust men and shall go into the wilderness to prepare there the way of Him; as it is written, 'Prepare in the wilderness the way of..., make straight in the desert a path for our God.'" They understood "preparing the way" as studying Torah, living righteously, and separating from the corrupt Jerusalem priesthood.</p>
    <p class="text-sm text-gray-700">John's wilderness preaching fits this interpretive tradition—he's preparing people for God's imminent intervention through moral reformation. But Matthew adds a Christological twist: John prepares the way not just for God's kingdom abstractly, but specifically for Jesus. Matthew retrospectively reads Jesus into Isaiah's text, making the herald announce Jesus's arrival rather than God's general return to Zion.</p>
  </div>
</div>
    `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-3-4-elijah-ascetic',
    verse_ref: 'NT:Matthew:3:4',
    title: 'Exegesis: The New Elijah',
    content: `
<div class="space-y-6">
  <div class="bg-blue-50 p-4 border-l-4 border-blue-500 rounded-r-lg">
    <strong class="block text-blue-900 text-sm mb-2">Typology of Dress</strong>
    <p class="text-sm text-blue-800 mb-2">John's clothing explicitly recalls Elijah's description in 2 Kings 1:8: "He wore a garment of hair and had a leather belt around his waist." By dressing like Elijah, John signals he stands in Elijah's prophetic tradition. Malachi 4:5-6 promised: "See, I will send the prophet Elijah to you before that great and dreadful day of the LORD comes. He will turn the hearts of the parents to their children, and the hearts of the children to their parents." Jewish tradition expected Elijah to return before the Messiah's arrival.</p>
    <p class="text-sm text-blue-800 mb-2">Jesus later confirms John is this Elijah figure (Matthew 11:14: "And if you are willing to accept it, he is Elijah who was to come"; Matthew 17:12-13: "But I tell you, Elijah has already come"). By dressing as Elijah, John visually announces his role as the prophetic forerunner, preparing people for the coming messianic age.</p>
  </div>
  <div class="bg-gray-50 p-4 border-l-4 border-gray-600 rounded-r-lg">
    <strong class="block text-gray-900 text-sm mb-2">Asceticism vs. Establishment</strong>
    <p class="text-sm text-gray-700 mb-2">John's ascetic lifestyle—wearing rough camel hair, eating locusts and wild honey—demonstrates his separation from normal society and rejection of luxury. This lifestyle contrasts sharply with the Jerusalem religious establishment (wealthy priests, scribes, Pharisees in fine clothing). John's asceticism authenticates his prophetic authority—he's not seeking comfort, status, or wealth, only calling people to repentance.</p>
    <p class="text-sm text-gray-700 mb-2">Locusts were permitted food under Levitical law (Leviticus 11:22), so John maintains ritual purity despite wilderness living. Wild honey suggests he lived off the land without cultivated agriculture, emphasizing his separateness from settled civilization. Some scholars note that the Qumran community also practiced asceticism, shared property communally, and maintained strict purity—raising questions about whether John had connections to Essene movements.</p>
    <p class="text-sm text-gray-700">However, John's public ministry along the Jordan differs from Qumran's sectarian withdrawal. The Essenes separated from "unjust men" and waited for God's intervention. John actively engages the public, calling them to baptism—a rite of purification and repentance available to all who come. This suggests John developed his own prophetic mission, possibly influenced by but not identical to sectarian movements like Qumran.</p>
  </div>
</div>
    `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-3-5-baptism-crowds',
    verse_ref: 'NT:Matthew:3:5',
    title: 'Exegesis: The New Exodus',
    content: `
<div class="space-y-6">
  <div class="bg-blue-50 p-4 border-l-4 border-blue-500 rounded-r-lg">
    <strong class="block text-blue-900 text-sm mb-2">Crossing the Jordan Again</strong>
    <p class="text-sm text-blue-800 mb-2">Matthew's hyperbolic language ("all of Judea," "all the region around the Jordan") emphasizes John's mass appeal. While likely exaggeration, the broader point stands: John attracted significant crowds, suggesting widespread dissatisfaction with the religious status quo and hunger for prophetic renewal. Josephus confirms John's popularity (Antiquities 18.5.2), noting Herod Antipas eventually executed John because he feared John's influence might spark rebellion.</p>
    <p class="text-sm text-blue-800 mb-2">The people "went out to him"—they had to leave their towns and travel to the wilderness. This exodus motif is deliberate: just as Israel went into wilderness to meet God after leaving Egypt, so people leave settled areas to encounter God's prophet in the wilderness. The journey itself symbolizes their willingness to leave normal life and submit to prophetic authority.</p>
    <p class="text-sm text-blue-800 mb-2">Baptism in the Jordan River carries powerful symbolism. The Jordan was where Israel crossed into the Promised Land under Joshua (Joshua 3-4), where Elijah divided the waters (2 Kings 2:8), where Elisha healed Naaman the Syrian (2 Kings 5). By baptizing in the Jordan, John evokes Israel's foundational moments of crossing over, cleansing, and entering into covenant relationship with God. Those who undergo John's baptism symbolically re-enter the covenant, retracing Israel's journey.</p>
  </div>
</div>
    `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-3-5-6-baptism-confession',
    verse_ref: 'NT:Matthew:3:5',
    title: 'Exegesis: The New Exodus & Confession',
    content: `
<div class="space-y-6">
  <div class="bg-blue-50 p-4 border-l-4 border-blue-500 rounded-r-lg">
    <strong class="block text-blue-900 text-sm mb-2">Crossing the Jordan Again</strong>
    <p class="text-sm text-blue-800 mb-2">Matthew's hyperbolic language ("all of Judea," "all the region around the Jordan") emphasizes John's mass appeal. This exodus motif is deliberate: just as Israel went into wilderness to meet God after leaving Egypt, so people leave settled areas to encounter God's prophet in the wilderness.</p>
    <p class="text-sm text-blue-800 mb-2">Baptism in the Jordan River evokes Israel's foundational moments: crossing into the Promised Land (Joshua 3-4) and Elijah/Elisha's miracles. Those who undergo John's baptism symbolically re-enter the covenant, retracing Israel's journey.</p>
  </div>
  
  <div class="bg-gray-50 p-4 border-l-4 border-gray-600 rounded-r-lg">
    <strong class="block text-gray-900 text-sm mb-2">Confession vs. Ritual</strong>
    <p class="text-sm text-gray-700 mb-2">John's baptism involves "confessing their sins"—public acknowledgment of wrongdoing. This distinguishes it from regular ritual washings (mikvah). It is a one-time initiatory rite signaling repentance and preparation for impending judgment.</p>
    <p class="text-sm text-gray-700">Remarkably, he offers this to Jews, implying that ethnic descent alone doesn't guarantee safety from judgment—a theme he expands on immediately in verses 8-9.</p>
  </div>
</div>
    `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-3-6-placeholder',
    verse_ref: 'NT:Matthew:3:6',
    title: 'Exegesis: See Notes on Verse 5',
    content: `
<div class="space-y-6">
  <p class="italic text-gray-500 text-sm">See notes on Verse 5 for full exegesis of the Baptism and Confession.</p>
</div>
    `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-3-7-vipers',
    verse_ref: 'NT:Matthew:3:7',
    title: 'Exegesis: Offspring of Vipers',
    content: `
<div class="space-y-6">
  <div class="bg-red-50 p-4 border-l-4 border-red-500 rounded-r-lg">
    <strong class="block text-red-900 text-sm mb-2">Pharisees & Sadducees</strong>
    <p class="text-sm text-red-800 mb-2">John's fierce denunciation introduces two groups: Pharisees and Sadducees. Understanding these groups is essential to grasping the religious and political landscape of first-century Judaism.</p>
    <p class="text-sm text-red-800 mb-2"><strong>Pharisees</strong> were a religious reform movement emphasizing strict observance of Torah, both written and oral traditions. They believed in resurrection, angels, divine providence, and purity laws for all. They critiqued the temple priesthood and had popular influence. Modern rabbinic Judaism descends from them.</p>
    <p class="text-sm text-red-800 mb-2"><strong>Sadducees</strong> were the priestly aristocracy controlling the temple. They believed only in written Torah, rejected resurrection/angels, and collaborated with Rome. They disappeared after the temple destruction in 70 CE.</p>
    <p class="text-sm text-red-800 mb-2">These two groups were theological and political opponents. Yet John lumps them together—"Pharisees and Sadducees"—treating them as equally guilty. This is historically odd. Possibilities: (1) Matthew anachronistically reads later Christian conflicts back into John's ministry; (2) they sent representatives to investigate John; (3) some individuals genuinely sought repentance.</p>
  </div>
  <div class="bg-amber-50 p-4 border-l-4 border-amber-600 rounded-r-lg">
    <strong class="block text-amber-900 text-sm mb-2">"Brood of Vipers"</strong>
    <p class="text-sm text-amber-800 mb-2">"Offspring of vipers" is shockingly harsh. Vipers were dangerous, deadly snakes—associated with evil and treachery. By calling religious leaders "offspring of vipers," John suggests they're spawned from evil, inherently dangerous, deceptive. This echoes prophetic denunciations of corrupt leaders.</p>
    <p class="text-sm text-amber-800 mb-2">"Who warned you to flee from the wrath to come?" is sarcastic, dripping with suspicion. John implies: you're not here from genuine repentance; you're here from fear of judgment, like snakes fleeing a fire. You're trying to escape consequences without real change.</p>
    <p class="text-sm text-amber-800">The "wrath to come" refers to God's eschatological judgment when the kingdom arrives. John preaches an imminent crisis—God is coming to establish his kingdom, which involves judgment on the unrighteous. Repentance isn't optional self-improvement; it's necessary survival preparation. This apocalyptic urgency pervades John's message.</p>
  </div>
</div>
    `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-3-8-fruit',
    verse_ref: 'NT:Matthew:3:8',
    title: 'Exegesis: Fruit Worthy of Repentance',
    content: `
<div class="space-y-6">
  <div class="bg-blue-50 p-4 border-l-4 border-blue-500 rounded-r-lg">
    <strong class="block text-blue-900 text-sm mb-2">Evidence vs. Ritual</strong>
    <p class="text-sm text-blue-800 mb-2">John demands evidence—"fruit" that demonstrates genuine repentance. The agricultural metaphor (repeated in verse 10) equates people to trees: good trees produce good fruit, bad trees bad fruit. Claiming repentance verbally means nothing without behavioral change. John requires visible, tangible transformation.</p>
    <p class="text-sm text-blue-800 mb-2">This emphasis on "fruit" or "works" as evidence of genuine faith is consistent throughout biblical literature. James 2:14-26 later argues faith without works is dead. Jesus himself uses the fruit metaphor (Matthew 7:16-20). The Quran repeatedly pairs faith with righteous deeds (iman wa amal salih).</p>
    <p class="text-sm text-blue-800 mb-2">For John, "fruit worthy of repentance" likely included ethical behavior aligned with Torah—justice, mercy, honesty, care for the poor, rejection of oppression. It would also include abandoning sins they had confessed during baptism.</p>
    <p class="text-sm text-blue-800">The demand for fruit exposes mere ritual compliance as insufficient. You can't simply go through baptismal motions while continuing the same corrupt behaviors. This critique applies especially to the religious leaders John addresses—their professional religious identity doesn't guarantee right standing with God. Position, knowledge of Scripture, ritual performance—none of these substitute for genuine moral transformation.</p>
  </div>
</div>
    `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-3-8-9-fruit-stones',
    verse_ref: 'NT:Matthew:3:8',
    title: 'Exegesis: Fruit, Stones, & Lineage',
    content: `
<div class="space-y-6">
  <div class="bg-blue-50 p-4 border-l-4 border-blue-500 rounded-r-lg">
    <strong class="block text-blue-900 text-sm mb-2">Evidence vs. Ritual</strong>
    <p class="text-sm text-blue-800 mb-2">John demands evidence—"fruit" that demonstrates genuine repentance. The agricultural metaphor equates people to trees. Claiming repentance verbally means nothing without behavioral change. John requires visible, tangible transformation.</p>
  </div>

  <div class="bg-gray-50 p-4 border-l-4 border-gray-600 rounded-r-lg">
    <strong class="block text-gray-900 text-sm mb-2">God from Stones: Ending Ethnic Privilege</strong>
    <p class="text-sm text-gray-700 mb-2">John attacks the common Jewish presumption that ethnic descent from Abraham guarantees divine favor. He argues that lineage means nothing without repentance.</p>
    <p class="text-sm text-gray-700 mb-2">God can create Abrahamic descendants from "these stones." The wordplay (Hebrew/Aramaic: <em>banim</em>/children vs <em>abanim</em>/stones) emphasizes that God can easily replace unrepentant descendants. This implies that covenant standing requires specific faithfulness, not just biology.</p>
    <p class="text-sm text-gray-700">This teaching has radical implications: if ethnic descent doesn't save, then Gentiles can potentially be included, and Jews can be excluded. It levels the playing field before God's judgment.</p>
  </div>
</div>
    `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-3-9-placeholder',
    verse_ref: 'NT:Matthew:3:9',
    title: 'Exegesis: See Notes on Verse 8',
    content: `
<div class="space-y-6">
  <p class="italic text-gray-500 text-sm">See notes on Verse 8 regarding Fruit and the "God from Stones" teaching.</p>
</div>
    `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-3-10-ax-root',
    verse_ref: 'NT:Matthew:3:10',
    title: 'Exegesis: The Ax at the Root',
    content: `
<div class="space-y-6">
  <div class="bg-amber-50 p-4 border-l-4 border-amber-600 rounded-r-lg">
    <strong class="block text-amber-900 text-sm mb-2">Imminent Judgment ("Even Now")</strong>
    <p class="text-sm text-amber-800 mb-2">The urgency intensifies—"even now" the ax is positioned, ready to strike. This isn't distant future judgment; it's imminent, immediate. The image is agricultural: a farmer inspecting trees, ax in hand, ready to cut down unproductive ones. The "root" emphasizes totality—not just trimming branches but complete removal, permanent destruction.</p>
    <p class="text-sm text-amber-800 mb-2">This image borrows from prophetic literature, especially Isaiah 10:33-34 where God's judgment is described as cutting down the forest with an ax. Jeremiah 6:6 commands "cut down the trees" in judgment against Jerusalem. John stands in this prophetic tradition, warning that God's judgment is falling—not on external enemies but on unfaithful Israel itself.</p>
    <p class="text-sm text-amber-800">The fire imagery introduces a new element: not just cutting down (ending life/excluding from kingdom) but burning (active destruction, punishment). Fire represents final, purifying judgment. This fits apocalyptic dualism—two destinations (kingdom/fire), two outcomes (salvation/destruction), requiring immediate choice.</p>
  </div>
</div>
    `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-3-11-mightier-one',
    verse_ref: 'NT:Matthew:3:11',
    title: 'Exegesis: Spirit & Fire',
    content: `
<div class="space-y-6">
  <div class="bg-blue-50 p-4 border-l-4 border-blue-500 rounded-r-lg">
    <strong class="block text-blue-900 text-sm mb-2">The Coming One's Identity</strong>
    <p class="text-sm text-blue-800 mb-2">John distinguishes his baptism from the coming one's baptism. John's water baptism signifies repentance—outward symbolic action corresponding to inward transformation. But "he who comes after me" will baptize in the Holy Spirit—something more powerful, more transformative, more direct.</p>
    <p class="text-sm text-blue-800 mb-2">Traditional Christian interpretation identifies "he who comes after me" as Jesus. Matthew certainly intends this reading. However, John's own expectation may have been more ambiguous. When John later sends disciples from prison to ask Jesus, "Are you the one who is to come...?" (Matthew 11:3), it suggests John wasn't entirely certain Jesus fulfilled his expectation of the coming judge.</p>
    <p class="text-sm text-blue-800 mb-2">John expected a powerful figure who would execute judgment, separate wheat from chaff, burn the wicked. Jesus's actual ministry emphasized mercy, healing, forgiveness, and inclusion—quite different from the fiery judge John described. This created confusion for John and raises the possibility that John expected a figure more along the lines of the Aaronic messiah described in Dead Sea Scrolls—a purifying teacher and judge who would reform Israel.</p>
  </div>
  <div class="bg-gray-50 p-4 border-l-4 border-gray-600 rounded-r-lg">
    <strong class="block text-gray-900 text-sm mb-2">Spirit Baptism</strong>
    <p class="text-sm text-gray-700 mb-2">"He will baptize you in the Holy Spirit" introduces pneumatology—the role of God's Spirit in the coming kingdom. The Spirit was associated with prophetic inspiration, divine presence, and end-times restoration. Ezekiel 36:25-27 promised: "I will sprinkle clean water on you... and I will put my Spirit in you." Joel 2:28-29 prophesied: "I will pour out my Spirit on all people."</p>
    <p class="text-sm text-gray-700">John may be referencing these prophetic promises—the coming one will fulfill what prophets predicted: internal transformation through God's Spirit, not just external water ritual. Spirit baptism represents direct divine intervention, interior renewal, empowerment for righteous living. This fits the Aaronic messiah's role: not political liberation but spiritual restoration, moral transformation, covenant renewal.</p>
  </div>
</div>
    `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-3-12-winnowing',
    verse_ref: 'NT:Matthew:3:12',
    title: 'Exegesis: The Winnowing Fork',
    content: `
<div class="space-y-6">
  <div class="bg-amber-50 p-4 border-l-4 border-amber-600 rounded-r-lg">
    <strong class="block text-amber-900 text-sm mb-2">Binary Judgment</strong>
    <p class="text-sm text-amber-800 mb-2">John's final image is agricultural: winnowing, the process of separating grain from chaff. After harvesting, grain was thrown into the air with a winnowing fork. Wind would blow away the light chaff while heavy grain fell back to the threshing floor. The grain was then gathered and stored; the useless chaff was burned.</p>
    <p class="text-sm text-amber-800 mb-2">This image perfectly captures John's dualistic message: the coming one will separate humanity into two categories—wheat (righteous, productive, valuable) and chaff (wicked, useless, worthless). The wheat enters the barn (kingdom); the chaff burns in "unquenchable fire" (eternal judgment). There's no third category, no middle ground. Everyone is either wheat or chaff, facing either salvation or destruction.</p>
    <p class="text-sm text-amber-800 mb-2">"Unquenchable fire" (asbestos) indicates fire that cannot be extinguished—permanent, eternal destruction. This contributes to later Christian doctrines of eternal punishment, though the image here may simply mean complete destruction rather than ongoing conscious torment. The point is finality: those judged wicked face irreversible exclusion from God's kingdom.</p>
    <p class="text-sm text-amber-800">This winnowing imagery comes from prophetic literature (Jeremiah 15:7, Isaiah 30:24). Malachi 3:2-3 describes the coming messenger as "a refiner's fire" who "will sit as a refiner and purifier of silver; he will purify the Levites." This is explicitly priestly imagery—refining and purifying the priesthood. If John sees himself as fulfilling Malachi's forerunner role, then the "coming one" he announces may be the priestly purifier who will reform corrupt religious leadership. This fits the Aaronic messiah expectation better than Davidic warrior-king expectations.</p>
  </div>
</div>
    `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-3-13-theological-problem',
    verse_ref: 'NT:Matthew:3:13',
    title: 'Exegesis: The Theological Embarrassment',
    content: `
<div class="space-y-6">
  <div class="bg-blue-50 p-4 border-l-4 border-blue-500 rounded-r-lg">
    <strong class="block text-blue-900 text-sm mb-2">Why Baptize the Sinless?</strong>
    <p class="text-sm text-blue-800 mb-2">Jesus's arrival from Galilee to the Jordan marks his first adult appearance in Matthew's Gospel after the childhood narratives. The geographical detail is significant: Jesus comes from Galilee, confirming his Nazarene identity, traveling south to the Jordan River where John conducts his baptismal ministry. This journey would cover roughly 60-70 miles, suggesting deliberate intent rather than casual encounter.</p>
    <p class="text-sm text-blue-800 mb-2">Matthew presents Jesus seeking baptism from John, but this creates an immediate theological problem that Matthew himself recognizes (verse 14). John's baptism was explicitly "for repentance" (verse 11), accompanied by "confessing their sins" (verse 6). Everyone else coming to John acknowledged personal sinfulness and need for cleansing. Why would Jesus, whom Matthew presents as divinely conceived, sinless, and the one greater than John, require a baptism of repentance?</p>
    <p class="text-sm text-blue-800 mb-2">This problem intensifies when we consider later Christian theology. By the time Matthew writes (80s-90s CE), Christian communities have developed high Christology—Jesus as divine, sinless, the Son of God, superior to all prophets including John. Yet here in the historical tradition, Jesus submits to John's baptism, seemingly acknowledging himself as a sinner needing repentance alongside tax collectors, prostitutes, and ordinary Jews. This is embarrassing to later theology.</p>
    <p class="text-sm text-blue-800">The historical likelihood is that Jesus did seek baptism from John, recognizing John as an authoritative prophetic figure. This historical fact created problems for early Christians trying to establish Jesus's superiority to John. We see this problem addressed differently across Gospels: Mark simply reports it; Matthew adds dialogue; Luke minimizes it; John's Gospel never directly states Jesus was baptized.</p>
  </div>
</div>
    `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-3-14-johns-protest',
    verse_ref: 'NT:Matthew:3:14',
    title: 'Exegesis: Matthew\'s Apologetic Addition',
    content: `
<div class="space-y-6">
  <div class="bg-amber-50 p-4 border-l-4 border-amber-600 rounded-r-lg">
    <strong class="block text-amber-900 text-sm mb-2">Unique to Matthew</strong>
    <p class="text-sm text-amber-800 mb-2">This verse appears only in Matthew—Mark, Luke, and John don't include John's protest. This is almost certainly Matthew's theological addition, addressing the embarrassment of Jesus submitting to John's baptism. By having John object and acknowledge Jesus's superiority, Matthew attempts to preserve Jesus's higher status even while reporting the baptism.</p>
    <p class="text-sm text-amber-800 mb-2">John's statement "I need to be baptized by you" implies John recognizes Jesus as possessing greater authority and purity than himself. This creates narrative tension with what Matthew has just presented: John has been the authoritative prophetic figure, calling religious leaders "offspring of vipers," demanding fruit of repentance, announcing the coming judge. Now suddenly John recognizes someone greater and defers to him.</p>
  </div>
  <div class="bg-red-50 p-4 border-l-4 border-red-500 rounded-r-lg">
    <strong class="block text-red-900 text-sm mb-2">Family Amnesia?</strong>
    <p class="text-sm text-red-800 mb-2">But here's the historical problem: if John and Jesus were cousins from priestly families, with John's father Zechariah serving as Mary's guardian, they would have known each other since childhood. John wouldn't just now be discovering Jesus's identity at the baptism. The recognition scene Matthew portrays is theologically motivated—showing John acknowledging Jesus—but historically implausible given their family connections.</p>
    <p class="text-sm text-red-800">John's question "you come to me?" expresses shock and reversal. The greater shouldn't submit to the lesser; the teacher shouldn't become the student; the judge shouldn't join the accused. By having John voice this objection, Matthew signals to readers: this baptism isn't what it appears. Don't think Jesus needed cleansing like everyone else. Something else is happening here.</p>
  </div>
</div>
    `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-3-15-righteousness',
    verse_ref: 'NT:Matthew:3:15',
    title: 'Exegesis: Fulfilling All Righteousness',
    content: `
<div class="space-y-6">
  <div class="bg-blue-50 p-4 border-l-4 border-blue-500 rounded-r-lg">
    <strong class="block text-blue-900 text-sm mb-2">Cryptic Explanation</strong>
    <p class="text-sm text-blue-800 mb-2">Jesus's response is cryptic and has generated endless theological interpretation. "Allow it now" (aphes arti) suggests temporary permission—let this happen now, even though it seems inappropriate. The "now" implies a specific moment in God's plan, a kairotic time when this action is necessary despite appearances.</p>
    <p class="text-sm text-blue-800 mb-2">The phrase "to fulfill all righteousness" (plērōsai pasan dikaiosunēn) is uniquely Matthean vocabulary. "Fulfill" (plēroō) is Matthew's favorite term for how Jesus relates to Scripture and God's purposes. "Righteousness" (dikaiosunē) appears seven times in Matthew, always referring to conforming to God's will or covenant requirements.</p>
    <p class="text-sm text-blue-800 mb-2">Interpretations include: (1) Identifying with humanity (incarnational solidarity); (2) Obeying God's will; (3) Fulfilling prophetic pattern (priestly consecration); (4) Validating John's ministry.</p>
    <p class="text-sm text-blue-800">Matthew's explanation is deliberately vague, allowing multiple meanings while avoiding direct statement that Jesus needed cleansing from sin. It's a theological evasion, acknowledging the baptism while reinterpreting its meaning. The very need for this explanation, however, confirms the historical reality: Jesus did undergo John's baptism of repentance, creating a theological problem Matthew addresses through creative interpretation.</p>
  </div>
</div>
    `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-3-16-vision',
    verse_ref: 'NT:Matthew:3:16',
    title: 'Exegesis: The Visionary Experience',
    content: `
<div class="space-y-6">
  <div class="bg-blue-50 p-4 border-l-4 border-blue-500 rounded-r-lg">
    <strong class="block text-blue-900 text-sm mb-2">Apocalyptic Opening</strong>
    <p class="text-sm text-blue-800 mb-2">Matthew describes a visionary experience accompanying the baptism. "The heavens were opened to him" suggests apocalyptic revelation—a moment when the barrier between earthly and heavenly realms becomes permeable, allowing divine communication. This language echoes Ezekiel 1:1 and Isaiah 64:1. The opening of heavens signifies unprecedented divine intervention, the beginning of eschatological fulfillment.</p>
  </div>
  <div class="bg-amber-50 p-4 border-l-4 border-amber-600 rounded-r-lg">
    <strong class="block text-amber-900 text-sm mb-2">Priestly Anointing</strong>
    <p class="text-sm text-amber-800 mb-2">"He saw the Spirit of God descending as a dove, and coming on him" introduces pneumatological imagery. The Spirit descending "like a dove" (hōsei peristeran) is a simile. Some suggest this evokes Genesis 1:2 where the Spirit hovers over primordial waters. Others see the dove as symbol of Israel (Hosea 11:11).</p>
    <p class="text-sm text-amber-800 mb-2">The Dead Sea Scrolls describe the Aaronic messiah as anointed with the Spirit for prophetic ministry. If Jesus is the Aaronic messiah, the Spirit's descent marks his consecration for prophetic-priestly ministry, empowering him to teach, heal, and lead people to repentance. The Spirit "coming on him" uses language of divine empowerment for specific tasks (Judges 6:34, 1 Samuel 10:6). This is anointing for leadership and prophetic ministry.</p>
    <p class="text-sm text-amber-800">Critically, this visionary experience may represent Jesus's own consciousness of calling and mission crystallizing at this moment. The baptism became a transformative experience where Jesus understood himself as specially chosen, Spirit-anointed, commissioned for prophetic ministry.</p>
  </div>
</div>
    `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-3-17-voice',
    verse_ref: 'NT:Matthew:3:17',
    title: 'Exegesis: The Composite Voice',
    content: `
<div class="space-y-6">
  <div class="bg-gray-50 p-4 border-l-4 border-gray-600 rounded-r-lg">
    <strong class="block text-gray-900 text-sm mb-2">Scriptural Mashup</strong>
    <p class="text-sm text-gray-700 mb-2">The heavenly voice (bath qol) provides divine authentication of Jesus's identity. The voice combines elements from multiple Old Testament texts, creating a composite scriptural declaration:</p>
    <ul class="list-disc pl-4 text-sm text-gray-700 space-y-1">
      <li><strong>Psalm 2:7:</strong> "You are my Son" (Royal King). This royal coronation psalm describes God addressing the Davidic king.</li>
      <li><strong>Isaiah 42:1:</strong> "In whom I delight" (Suffering Servant). The Servant Song describes a chosen figure who brings justice through patient ministry.</li>
      <li><strong>Genesis 22:2:</strong> "Beloved Son" (Sacrificial Isaac). The Akedah story uses "your beloved son," which the heavenly voice echoes.</li>
    </ul>
    <p class="text-sm text-gray-700 mt-2">This creates a Messiah who is both <strong>King</strong> and <strong>Servant</strong>—authoritative yet humble. Matthew's version says "This is my beloved Son" (third person, public announcement), while Mark says "You are my Son" (second person, private revelation). This shift serves Matthew's apologetic purpose: the baptism wasn't just Jesus's private spiritual experience but public divine declaration witnessed by others.</p>
  </div>
</div>
    `,
    media_content: [],
    cross_refs: []
  },
  // --- MATTHEW 4 ---
  {
    id: 'local-matt-4-1-temptation-intro',
    verse_ref: 'NT:Matthew:4:1',
    title: 'Exegesis: The Spirit & The Adversary',
    content: `
<div class="space-y-6">
  <div class="bg-blue-50 p-4 border-l-4 border-blue-500 rounded-r-lg">
    <strong class="block text-blue-900 text-sm mb-2">Led Up by the Spirit</strong>
    <p class="text-sm text-blue-800 mb-2">Immediately following the baptism and divine commissioning, Jesus is "led up by the Spirit" into the wilderness. The verb "led up" (anēchthē) is passive—Jesus doesn't choose this journey; the Spirit compels him. This divine compulsion connects the temptation directly to Jesus's baptismal experience. The same Spirit that descended on him (3:16) now drives him into confrontation with the devil.</p>
    <p class="text-sm text-blue-800 mb-2">The "wilderness" (erēmos) is loaded with theological significance in Jewish tradition. It's where Israel wandered for forty years after the Exodus, where they were tested and repeatedly failed. It's where Moses received the Law at Sinai. It's where Elijah fled and encountered God (1 Kings 19). It's where the Qumran community established their sectarian commune to "prepare the way of the Lord" (Isaiah 40:3). The wilderness represents both danger (demonic habitation, desolation) and divine encounter (revelation, purification, testing).</p>
  </div>
  <div class="bg-amber-50 p-4 border-l-4 border-amber-600 rounded-r-lg">
    <strong class="block text-amber-900 text-sm mb-2">Tempted vs. Tested</strong>
    <p class="text-sm text-amber-800 mb-2">Matthew explicitly states Jesus went "to be tempted" (peirasthēnai)—this is the purpose of the Spirit's leading. The Greek word can mean "tempted" (solicitation to evil) or "tested" (proving/refining). Both meanings apply here. From Satan's perspective, these are temptations—attempts to make Jesus sin, compromise his mission, or misuse his authority. From God's perspective, this is testing—proving Jesus's faithfulness, preparing him for ministry, demonstrating his qualification as God's chosen one.</p>
  </div>
  <div class="bg-red-50 p-4 border-l-4 border-red-500 rounded-r-lg">
    <strong class="block text-red-900 text-sm mb-2">The Devil & Cosmic Conflict</strong>
    <p class="text-sm text-red-800 mb-2">The introduction of "the devil" (diabolos—"slanderer" or "accuser") brings cosmic conflict into Matthew's narrative. Satan appears throughout Jewish literature as the adversary who tests human faithfulness (Job 1-2), accuses the righteous (Zechariah 3:1-2), and seeks to derail God's purposes. The Dead Sea Scrolls describe cosmic dualism between the Spirit of Truth and the Spirit of Deceit, with humans caught between these forces. Jesus's temptation represents this cosmic battle—God's chosen agent confronting the enemy directly.</p>
    <p class="text-sm text-red-800 mb-2">Critically, Matthew is expanding Mark's brief account. Mark 1:12-13 compresses the temptation into two verses... Matthew (and Luke, independently) expand this tradition dramatically, creating three specific temptations with detailed scriptural debates. This expansion suggests Matthew is constructing a theological narrative using Mark's skeleton. The specific temptations, the scriptural quotations, and the dialogue may be Matthew's creative composition rather than historical memory.</p>
  </div>
</div>
    `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-4-2-fasting',
    verse_ref: 'NT:Matthew:4:2',
    title: 'Exegesis: The New Moses',
    content: `
<div class="space-y-6">
  <div class="bg-blue-50 p-4 border-l-4 border-blue-500 rounded-r-lg">
    <strong class="block text-blue-900 text-sm mb-2">Forty Days & Nights</strong>
    <p class="text-sm text-blue-800 mb-2">The "forty days and forty nights" immediately evokes Moses, who fasted forty days and nights on Mount Sinai receiving the Law (Exodus 34:28, Deuteronomy 9:9). This is Matthew's continued Moses typology that began in chapter 2... Jesus recapitulates Moses's experience: Moses fasted forty days on the mountain receiving Torah; Jesus fasts forty days in the wilderness being tested on Torah.</p>
    <p class="text-sm text-blue-800 mb-2">The number forty also recalls Israel's forty years wandering in the wilderness (Numbers 14:33-34, Deuteronomy 8:2). God tested Israel in the wilderness, and they repeatedly failed... Jesus now undergoes Israel's test in compressed form (forty days representing forty years), succeeding where Israel failed. Jesus becomes faithful Israel reduced to one person, passing the test the nation failed.</p>
    <p class="text-sm text-blue-800">Elijah also fasted forty days and nights while journeying to Mount Horeb (1 Kings 19:8)... By fasting forty days, Jesus positions himself in this prophetic tradition—Moses, Elijah, and now Jesus, the prophet like Moses (Deuteronomy 18:15-18) whom Matthew consistently presents.</p>
  </div>
  <div class="bg-red-50 p-4 border-l-4 border-red-500 rounded-r-lg">
    <strong class="block text-red-900 text-sm mb-2">Genuine Humanity</strong>
    <p class="text-sm text-red-800 mb-2">The detail "he was hungry afterward" is almost comically understated... But this mundane physical detail emphasizes Jesus's genuine humanity. He experiences real hunger, real physical weakness, real vulnerability. This isn't a docetic Christ who only appears human; this is embodied humanity facing bodily temptation. The hunger makes the first temptation's appeal acute—he's genuinely famished, making the offer of bread immediately relevant.</p>
  </div>
</div>
    `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-4-3-stones-bread',
    verse_ref: 'NT:Matthew:4:3',
    title: 'Exegesis: Stones to Bread',
    content: `
<div class="space-y-6">
  <div class="bg-amber-50 p-4 border-l-4 border-amber-600 rounded-r-lg">
    <strong class="block text-amber-900 text-sm mb-2">The First Temptation</strong>
    <p class="text-sm text-amber-800 mb-2">Satan's first temptation directly challenges Jesus's identity announced at the baptism... The phrase "If you are the Son of God" can be translated as conditional ("if") or as factual statement ("since you are")... The temptation targets Jesus's physical hunger after forty days of fasting. Turning stones to bread would satisfy immediate bodily need, demonstrate power, and seem entirely reasonable... However, the temptation operates on multiple levels beyond immediate hunger:</p>
    <ul class="list-disc pl-4 text-sm text-amber-800 space-y-2 mt-2">
      <li><strong>1. Misusing divine power for selfish purposes.</strong> Would Jesus use miraculous ability to serve himself rather than others?... Satan tempts Jesus to make an exception, to use divine power selfishly.</li>
      <li><strong>2. Distrust of divine provision.</strong> God's Spirit led Jesus into the wilderness. Trusting God means believing God will provide... It's functionally saying: "God hasn't provided, so I'll provide for myself."</li>
      <li><strong>3. Taking independent action outside God's plan.</strong> Jesus has been Spirit-led into wilderness for testing. Creating bread circumvents the test... It's grasping comfort prematurely rather than trusting God's process.</li>
      <li><strong>4. Pursuing messianic mission through worldly power.</strong> If Jesus's mission involves establishing God's kingdom, demonstrating power over natural elements... could gain followers... But this would be kingdom-building through spectacle... rather than through faithful obedience.</li>
    </ul>
  </div>
</div>
    `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-4-4-bread-alone',
    verse_ref: 'NT:Matthew:4:4',
    title: 'Exegesis: Living by God\'s Word',
    content: `
<div class="space-y-6">
  <div class="bg-blue-50 p-4 border-l-4 border-blue-500 rounded-r-lg">
    <strong class="block text-blue-900 text-sm mb-2">It Is Written (Deuteronomy 8:3)</strong>
    <p class="text-sm text-blue-800 mb-2">Jesus responds with Scripture, quoting Deuteronomy 8:3: "He humbled you, causing you to hunger and then feeding you with manna... to teach you that man does not live on bread alone but on every word that comes from the mouth of the LORD."</p>
    <p class="text-sm text-blue-800 mb-2">This quotation comes from Moses's sermon reviewing Israel's wilderness experience... The lesson: physical bread sustains physical life, but God's word (commands, promises, ongoing relationship) sustains ultimate life... By quoting this verse, Jesus identifies himself with Israel's wilderness experience. Israel was tested through hunger; Jesus is tested through hunger. Israel learned (eventually) to trust God's provision; Jesus demonstrates immediate trust without needing to create his own provision.</p>
  </div>
  <div class="bg-gray-50 p-4 border-l-4 border-gray-600 rounded-r-lg">
    <strong class="block text-gray-900 text-sm mb-2">Rabbinical Debate</strong>
    <p class="text-sm text-gray-700 mb-2">Jesus's response also establishes the pattern for all three temptations: answering Satan with Scripture. This creates a rabbinical debate format—Satan and Jesus dueling with biblical texts, competing interpretations of God's word. Jesus demonstrates mastery of Torah, proper interpretation, and faithful application. This fits the Aaronic messiah profile: a teacher of Torah, interpreter of God's word, one who understands Scripture's deeper meaning and lives according to divine commands.</p>
    <p class="text-sm text-gray-700">Critically, Jesus refuses to use divine power artificially or prematurely. He won't force God's hand or act independently of divine timing and purpose. This becomes explicit in the second temptation...</p>
  </div>
</div>
    `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-4-5-pinnacle',
    verse_ref: 'NT:Matthew:4:5',
    title: 'Exegesis: The Pinnacle & The Promise',
    content: `
<div class="space-y-6">
  <div class="bg-red-50 p-4 border-l-4 border-red-500 rounded-r-lg">
    <strong class="block text-red-900 text-sm mb-2">The Holy City & The Pinnacle</strong>
    <p class="text-sm text-red-800 mb-2">The second temptation shifts location to "the holy city" (Jerusalem) and specifically "the pinnacle of the temple" (to pterugion tou hierou). The "pinnacle" likely refers to the southeastern corner of the temple mount where the Royal Portico met Solomon's Portico, creating a high point overlooking the Kidron Valley—a drop of several hundred feet. Josephus describes this corner as a dizzying height where looking down caused vertigo (Antiquities 15.11.5).</p>
  </div>
  <div class="bg-amber-50 p-4 border-l-4 border-amber-600 rounded-r-lg">
    <strong class="block text-amber-900 text-sm mb-2">Satan Quotes Scripture (Psalm 91)</strong>
    <p class="text-sm text-amber-800 mb-2">Satan now uses Scripture himself, quoting Psalm 91:11-12: "For he will command his angels concerning you to guard you in all your ways; they will lift you up in their hands, so that you will not strike your foot against a stone." This is remarkable—Satan quotes Bible! The temptation becomes more sophisticated: Satan isn't proposing outright sin but suggesting Jesus follow Scripture's explicit promise.</p>
    <p class="text-sm text-amber-800 mb-2">Satan's temptation is clever: "You're the Son of God (as announced at baptism). Psalm 91 promises God protects his beloved. Prove both your identity and God's faithfulness by jumping... It's a win-win—you demonstrate who you are, God demonstrates his faithfulness, and witnesses see a spectacular miracle that launches your messianic mission with undeniable public validation."</p>
    <ul class="list-disc pl-4 text-sm text-amber-800 space-y-2 mt-2">
      <li><strong>1. Spectacular public validation.</strong> Jumping from the temple pinnacle and surviving would create immediate, massive public credibility... Satan offers a shortcut to messianic recognition—instead of slow, difficult ministry, achieve instant fame through spectacle.</li>
      <li><strong>2. Testing God's promises.</strong> Satan frames this as validating God's word... But this is forcing God to prove himself, demanding God perform on human terms.</li>
      <li><strong>3. Artificial invocation of prophecy.</strong> The crucial point is that Psalm 91's protection is promised for those who genuinely trust God during actual danger, not for those who create artificial danger to force God's intervention.</li>
      <li><strong>4. Misunderstanding messianic mission.</strong> Satan offers Jesus a path to messiahship through wonder-working and public spectacle rather than through faithful teaching, sacrificial service, and moral reformation.</li>
    </ul>
  </div>
</div>
    `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-4-7-testing-god',
    verse_ref: 'NT:Matthew:4:7',
    title: 'Exegesis: Testing vs. Trusting',
    content: `
<div class="space-y-6">
  <div class="bg-blue-50 p-4 border-l-4 border-blue-500 rounded-r-lg">
    <strong class="block text-blue-900 text-sm mb-2">It Is Written (Deuteronomy 6:16)</strong>
    <p class="text-sm text-blue-800 mb-2">Jesus responds by quoting Deuteronomy 6:16: "Do not put the LORD your God to the test as you did at Massah." This verse recalls Israel's rebellion at Massah (meaning "testing") recorded in Exodus 17:1-7... Jesus identifies Satan's proposal as this kind of testing—artificially creating a crisis to force God's hand, demanding God prove his promises.</p>
    <p class="text-sm text-blue-800 mb-2">Critically, when Jesus says "the Lord, your God," he's referring to the Father, not himself. Some Christian interpreters try to make this a Trinitarian statement... But the context is clear: Jesus is quoting Deuteronomy's command not to test Yahweh. Jesus is refusing to test the Father by forcing the Father to send angels prematurely.</p>
  </div>
  <div class="bg-gray-50 p-4 border-l-4 border-gray-600 rounded-r-lg">
    <strong class="block text-gray-900 text-sm mb-2">Gethsemane & Waffa Connection</strong>
    <p class="text-sm text-gray-700 mb-2">Jesus's refusal reveals his understanding of Psalm 91's proper application. The psalm promises divine protection, and Jesus doesn't deny this promise applies to him. But protection comes when genuinely needed, not when artificially manufactured.</p>
    <p class="text-sm text-gray-700 mb-2">The legitimate fulfillment of Psalm 91's protection comes later in Jesus's ministry—specifically in the Garden of Gethsemane when Jesus prays "Father, if you are willing, take this cup from me" (Luke 22:42). There, Jesus faces genuine danger... and calls on God for protection.</p>
    <p class="text-sm text-gray-700">According to the interpretation presented in the earlier document, God answered Jesus's Gethsemane prayer by performing waffa (soul-extraction) before the crucifixion... The angels came to strengthen Jesus (Luke 22:43), fulfilling Psalm 91's promise... This is legitimate fulfillment—angels guarding Jesus when genuinely threatened, not during staged spectacle.</p>
  </div>
</div>
    `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-4-14-16-isaiah-light',
    verse_ref: 'NT:Matthew:4:14',
    title: 'Exegesis: Light in Galilee (Isaiah 9)',
    content: `
<div class="space-y-6">
  <div class="bg-blue-50 p-4 border-l-4 border-blue-500 rounded-r-lg">
    <strong class="block text-blue-900 text-sm mb-2">The Invocation of Isaiah 9</strong>
    <p class="text-sm text-blue-800 mb-2">Matthew cites Isaiah 9:1-2 to justify Jesus's move to Capernaum in "Galilee of the Gentiles." In its original context, Isaiah was predicting restoration for the northern tribes (Zebulun and Naphtali) after they were devastated by Assyrian invasion (732 BCE). These regions, walked over by conquering armies, were in "darkness" and "gloom."</p>
    <p class="text-sm text-blue-800 mb-2">Matthew sees Jesus's presence in this exact region as the fulfillment of Isaiah's promise. The "great light" is no longer just political liberation from Assyria, but the arrival of the Messianic kingdom. By beginning his ministry here—far from Jerusalem's religious center—Jesus signals that God's restoration starts at the margins, among those "in the shadow of death."</p>
  </div>
</div>
    `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-4-8-kingdoms',
    verse_ref: 'NT:Matthew:4:8',
    title: 'Exegesis: The Political Temptation',
    content: `
<div class="space-y-6">
  <div class="bg-amber-50 p-4 border-l-4 border-amber-600 rounded-r-lg">
    <strong class="block text-amber-900 text-sm mb-2">All Kingdoms & Their Glory</strong>
    <p class="text-sm text-amber-800 mb-2">The third temptation offers political power—"all the kingdoms of the world, and their glory." This is the Davidic messianic expectation: a king who rules over nations, defeats Israel's enemies, establishes global dominion.</p>
    <p class="text-sm text-amber-800 mb-2">Satan claims ownership of these kingdoms—"I will give you all of these things." This claim isn't entirely false within biblical worldview. Satan is called "the prince of this world"... The offer is the ultimate political temptation: achieve messianic mission's goal (establishing God's kingdom over all nations) through political conquest and worldly power rather than through suffering, teaching, and sacrificial service.</p>
  </div>
  <div class="bg-red-50 p-4 border-l-4 border-red-500 rounded-r-lg">
    <strong class="block text-red-900 text-sm mb-2">Two Paths to Messiahship</strong>
    <p class="text-sm text-red-800 mb-2">This temptation represents the fundamental choice between two paths to messiahship:</p>
    <ul class="list-disc pl-4 text-sm text-red-800 space-y-2 mt-2">
      <li><strong>Path 1 (Satan's offer):</strong> Davidic warrior-king who conquers through military might, establishes political kingdom, rules nations through worldly power structures. This is the popular messianic expectation.</li>
      <li><strong>Path 2 (Jesus's mission):</strong> Aaronic priestly-prophet who teaches, heals, leads people to repentance, suffers rejection, and establishes spiritual kingdom through moral transformation rather than political conquest.</li>
    </ul>
    <p class="text-sm text-red-800 mt-2">The worship demand reveals the temptation's core: idolatry. Satan wants Jesus to compromise absolute loyalty to God by acknowledging Satan as legitimate authority deserving worship.</p>
  </div>
</div>
    `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-4-10-worship-god',
    verse_ref: 'NT:Matthew:4:10',
    title: 'Exegesis: Monotheistic Loyalty',
    content: `
<div class="space-y-6">
  <div class="bg-blue-50 p-4 border-l-4 border-blue-500 rounded-r-lg">
    <strong class="block text-blue-900 text-sm mb-2">Get Behind Me, Satan!</strong>
    <p class="text-sm text-blue-800 mb-2">Jesus responds with the sharpest rebuke yet: "Get behind me, Satan!"... Jesus quotes Deuteronomy 6:13: "Fear the LORD your God, serve him only..." This verse is central to the Shema, the fundamental Jewish confession of monotheism. By invoking it, Jesus asserts that worship belongs exclusively to Yahweh—no political power, no matter how glorious, justifies compromising this absolute loyalty.</p>
    <p class="text-sm text-blue-800 mb-2">The context of Deuteronomy 6 warns Israel not to forget Yahweh when they enter the land and enjoy its prosperity. Jesus applies this to the "kingdoms of the world"—prosperity and power must not replace allegiance to God.</p>
  </div>
  <div class="bg-gray-50 p-4 border-l-4 border-gray-600 rounded-r-lg">
    <strong class="block text-gray-900 text-sm mb-2">Mission Clarification</strong>
    <p class="text-sm text-gray-700 mb-2">By rejecting worldly kingdoms offered through satanic worship, Jesus clarifies his messianic mission: he won't establish political kingdom through military conquest or worldly power. His kingdom is "not of this world" (John 18:36).</p>
    <p class="text-sm text-gray-700">This rejection is crucial for understanding Jesus's relationship to Davidic messianic expectations. Jesus refuses the Davidic warrior-king path... Jesus fulfills the Aaronic role; the Davidic messianic mission (political restoration of Israel) remains unfulfilled, which is why Jews don't accept Jesus as the Messiah—he didn't accomplish what Davidic prophecies predicted.</p>
  </div>
</div>
    `,
    media_content: [],
    cross_refs: []
  },
  {
    id: 'local-matt-4-11-angelic-service',
    verse_ref: 'NT:Matthew:4:11',
    title: 'Exegesis: Angelic Service & Victory',
    content: `
<div class="space-y-6">
  <div class="bg-blue-50 p-4 border-l-4 border-blue-500 rounded-r-lg">
    <strong class="block text-blue-900 text-sm mb-2">Victory & Angelic Service</strong>
    <p class="text-sm text-blue-800 mb-2">"Angels came and served him" fulfills the need Satan first exploited—Jesus's hunger. God provides what Jesus needed... through angelic ministry, demonstrating that trust in divine provision was justified.</p>
    <p class="text-sm text-blue-800 mb-2">The angelic service also recalls Psalm 91's promise... Jesus refused to invoke this promise artificially... Now angels do come, serving and ministering to him, confirming Psalm 91 applies but in God's timing and way.</p>
  </div>
  <div class="bg-amber-50 p-4 border-l-4 border-amber-600 rounded-r-lg">
    <strong class="block text-amber-900 text-sm mb-2">Critical Assessment</strong>
    <p class="text-sm text-amber-800 mb-2">The temptation narrative is almost certainly Matthew's (and Luke's) theological expansion of Mark's brief notice. The specific temptations, scriptural debates, and dialogue are likely Matthew's creative composition designed to teach Christological and ethical lessons rather than historical reportage.</p>
    <p class="text-sm text-amber-800">Jesus's responses, all drawn from Deuteronomy, position him as faithful Israel succeeding where the nation failed. Jesus passes the tests Israel failed, qualifying him as the one who embodies Israel's covenant faithfulness. This fits the Aaronic messiah profile: a teacher who knows Scripture, interprets it correctly, lives according to God's commands, and leads others to covenant faithfulness.</p>
  </div>
</div>
    `,
    media_content: [],
    cross_refs: []
  }
];

// --- ACTIONS ---

export async function fetchChapterNotes(source: string, book: string, chapter: number): Promise<StudyEntry[]> {
  // Map URL source to DB prefix
  const prefixMap: Record<string, string> = {
    'new-testament': 'NT',
    'old-testament': 'OT',
    'quran': 'QURAN'
  };
  const dbSource = prefixMap[source] || source.toUpperCase();

  // Return only local entries
  return getLocalEntries(dbSource, book, chapter);
}

function getLocalEntries(dbSource: string, book: string, chapter: number): StudyEntry[] {
  const prefix = `${dbSource}:${book}:${chapter}:`;
  return localStudyEntries.filter(entry => entry.verse_ref.startsWith(prefix));
}

export async function createStudyEntry(entry: Partial<StudyEntry>) {
  throw new Error("createStudyEntry is disabled as Supabase has been removed.");
}
