export interface GenealogyProof {
    verseNum: number;
    hoverQuote: string; // large tooltip text
    exegesisContent: string; // HTML for the study notebook
    media_content?: { type: string, title: string, url: string }[];
}

const proofStyle = "bg-amber-50/50 p-4 rounded border border-amber-100 mb-4";
const labelStyle = "block text-sm font-sans font-bold uppercase tracking-widest text-amber-600 mb-2";
const textStyle = "text-gray-800 leading-relaxed text-lg";
const criticalStyle = "bg-red-50/50 p-4 rounded border border-red-100 mb-4";
const criticalLabel = "block text-sm font-sans font-bold uppercase tracking-widest text-red-600 mb-2";
const citationLabel = "block text-xs font-sans font-bold uppercase tracking-widest text-gray-500 mt-3 mb-1";
const quoteStyle = "text-gray-700 italic bg-gray-50/50 p-3 pl-4 border-l-4 border-gray-300 text-base block leading-relaxed";

export const GENEALOGY_PROOFS: Record<number, GenealogyProof> = {
    1: {
        verseNum: 1,
        hoverQuote: "The Book of the Generation of Jesus Christ, the Son of David, the Son of Abraham.",
        media_content: [
            {
                type: 'youtube',
                title: 'The Gospel of Matthew is Pure Brilliance! (Dr. Bart Ehrman)',
                url: 'https://youtu.be/hCyFw3jnoUk?si=8x2s2chOMZQvsd0D'
            },
            {
                type: 'youtube',
                title: 'Which Messiah was Jesus? (QuranTalk)',
                url: 'https://youtu.be/IN0KgsdCT_s?si=FUyLhkA3KTN7BDZN'
            },
            {
                type: 'youtube',
                title: 'Gospel Discrepancies: Why Matthew and Luke Tell Different Christmas Stories (QuranTalk)',
                url: 'https://youtu.be/hap8ZGDNtTM?si=rGVuA6DlcfkVClkG'
            },
            {
                type: 'youtube',
                title: 'Did the Gospels Copy Each Other?',
                url: 'https://www.youtube.com/watch?v=yV9VPM7lIoQ'
            }
        ],
        exegesisContent: `
             <div class="font-serif">
                <h3 class="text-xl font-bold text-gray-900 mb-4 font-playfair">The Genesis of Jesus</h3>
                
                <div class="${proofStyle}">
                    <span class="${labelStyle}">Thesis Statement</span>
                    <p class="${textStyle} mb-3">
                        This opening verse functions as the thesis statement for Matthew's entire genealogy, making two crucial messianic claims:
                    </p>
                    <ul class="list-disc ml-5 space-y-2 text-gray-800 mb-3">
                        <li><strong>"Son of David":</strong> Establishing royal messianic credentials.</li>
                        <li><strong>"Son of Abraham":</strong> Establishing covenant continuity with Israel's patriarch.</li>
                    </ul>
                     <p class="${textStyle}">
                        The Greek phrase <em>biblos geneseōs</em> ("book of genealogy") echoes Genesis 5:1's <em>toledot</em> formula, positioning Jesus as the climax of salvation history.
                    </p>
                </div>

                <div class="${proofStyle}">
                    <span class="${labelStyle}">Son of David</span>
                    <p class="${textStyle}">
                        By calling Jesus "son of David," Matthew invokes the messianic prophecies requiring the Messiah to be a biological descendant of King David who would reign on his throne (2 Samuel 7:12-16, Jeremiah 23:5, Isaiah 11:1).
                    </p>
                    <p class="${textStyle} mt-2">
                        This phrase appears 10 times in Matthew's Gospel, making Davidic descent central to his christological argument. However, this claim becomes problematic when Matthew's own narrative reveals Joseph (through whom the genealogy traces) is not Jesus's biological father (1:18-25).
                    </p>
                </div>

                 <div class="${proofStyle}">
                    <span class="${labelStyle}">Son of Abraham</span>
                    <p class="${textStyle}">
                        "Son of Abraham" roots Jesus in the original covenant promise that "all peoples on earth will be blessed through you" (Genesis 22:18).
                    </p>
                     <p class="${textStyle} mt-2">
                        This signals that Matthew sees Jesus's significance extending beyond Israel to the nations. This universalist theme resurfaces in Matthew's inclusion of Gentile women (Tamar, Rahab, Ruth) and concludes with the Great Commission (28:19).
                    </p>
                </div>
            </div>
        `
    },
    2: {
        verseNum: 2,
        hoverQuote: "Genesis 25:19 ...Isaac begat Jacob. \nGenesis 35:23 The sons of Leah; Reuben, Jacob's firstborn, and Simeon, and Levi, and Judah...",
        exegesisContent: `
            <div class="font-serif">
                <h3 class="text-xl font-bold text-gray-900 mb-4 font-playfair">Abraham to Judah</h3>
                <div class="${proofStyle}">
                    <span class="${labelStyle}">Scriptural Verification</span>
                    <ul class="space-y-4 mt-2">
                        <li class="pl-3 border-l-2 border-amber-200">
                            <strong>Abraham → Isaac</strong>
                            <span class="${citationLabel}">Genesis 21:3</span>
                            <span class="${quoteStyle}">"And Abraham called the name of his son that was born unto him, whom Sarah bare to him, <strong>Isaac</strong>."</span>
                        </li>
                        <li class="pl-3 border-l-2 border-amber-200">
                            <strong>Isaac → Jacob</strong>
                            <span class="${citationLabel}">Genesis 25:26</span>
                            <span class="${quoteStyle}">"And after that came his brother out, and his hand took hold on Esau's heel; and his name was called <strong>Jacob</strong>: and Isaac was threescore years old when she bare them."</span>
                        </li>
                        <li class="pl-3 border-l-2 border-amber-200">
                            <strong>Jacob → Judah</strong>
                            <span class="${citationLabel}">Genesis 29:35</span>
                            <span class="${quoteStyle}">"And she conceived again, and bare a son; and she said, Now will I praise the LORD: therefore she called his name <strong>Judah</strong>; and left bearing."</span>
                        </li>
                    </ul>
                </div>
            </div>
        `
    },
    3: {
        verseNum: 3,
        hoverQuote: "Genesis 38:29 ...his name was called Pharez.\nRuth 4:18 Now these are the generations of Pharez: Pharez begat Hezron...",
        exegesisContent: `
            <div class="font-serif">
                <h3 class="text-xl font-bold text-gray-900 mb-4 font-playfair">Judah to Hezron</h3>
                <div class="${proofStyle}">
                     <span class="${labelStyle}">Scriptural Verification</span>
                     <ul class="space-y-4 mt-2">
                        <li class="pl-3 border-l-2 border-amber-200">
                            <strong>Judah → Perez</strong>
                             <span class="${citationLabel}">Genesis 38:29</span>
                            <span class="${quoteStyle}">"And it came to pass... his name was called <strong>Pharez</strong> [Perez]."</span>
                        </li>
                         <li class="pl-3 border-l-2 border-amber-200">
                            <strong>Perez → Hezron</strong>
                             <span class="${citationLabel}">Ruth 4:18</span>
                            <span class="${quoteStyle}">"Now these are the generations of Pharez: Pharez begat <strong>Hezron</strong>."</span>
                        </li>
                     </ul>
                </div>

                <div class="${criticalStyle}">
                    <span class="${criticalLabel}">Textual Variant: Aram vs Ram</span>
                    <p class="${textStyle} mb-2">
                        Matthew uses <strong>Aram</strong> where Chronicles uses <strong>Ram</strong>.
                    </p>
                    <ul class="space-y-2 mt-1">
                        <li class="pl-3 border-l-2 border-red-200 text-sm">
                            <span class="font-bold text-red-700">Matthew 1:3</span>
                            <div class="italic text-gray-600">"And Esrom begat <strong>Aram</strong>..."</div>
                        </li>
                        <li class="pl-3 border-l-2 border-green-200 text-sm">
                             <span class="font-bold text-green-700">1 Chronicles 2:9</span>
                             <div class="italic text-gray-600">"The sons also of Hezron... <strong>Ram</strong>, and Chelubai."</div>
                        </li>
                    </ul>
                    <p class="${textStyle} text-sm mt-2 italic">
                        This may reflect textual fluidity, but it contributes to cumulative instability in the list.
                    </p>
                </div>
            </div>
        `
    },
    4: {
        verseNum: 4,
        hoverQuote: "Ruth 4:19 And Hezron begat Ram, and Ram begat Amminadab, And Amminadab begat Nahshon...",
        exegesisContent: `
            <div class="font-serif">
                <h3 class="text-xl font-bold text-gray-900 mb-4 font-playfair">Ram to Nahshon</h3>
                <div class="${proofStyle}">
                    <span class="${labelStyle}">Scriptural Verification</span>
                    <ul class="space-y-4 mt-2">
                        <li class="pl-3 border-l-2 border-amber-200">
                            <strong>Ram → Amminadab</strong>
                             <span class="${citationLabel}">Ruth 4:19</span>
                            <span class="${quoteStyle}">"And Hezron begat Ram, and <strong>Ram begat Amminadab</strong>."</span>
                        </li>
                        <li class="pl-3 border-l-2 border-amber-200">
                            <strong>Amminadab → Nahshon</strong>
                             <span class="${citationLabel}">Ruth 4:20</span>
                            <span class="${quoteStyle}">"And <strong>Amminadab begat Nahshon</strong>, and Nahshon begat Salmon."</span>
                        </li>
                    </ul>
                </div>
            </div>
        `
    },
    5: {
        verseNum: 5,
        hoverQuote: "Ruth 4:21 And Salmon begat Boaz, and Boaz begat Obed...",
        exegesisContent: `
            <div class="font-serif">
                <h3 class="text-xl font-bold text-gray-900 mb-4 font-playfair">Salmon to Obed</h3>
                <div class="${proofStyle}">
                    <span class="${labelStyle}">Scriptural Verification</span>
                    <ul class="space-y-4 mt-2">
                        <li class="pl-3 border-l-2 border-amber-200">
                            <strong>Salmon → Boaz</strong>
                             <span class="${citationLabel}">Ruth 4:21</span>
                            <span class="${quoteStyle}">"And <strong>Salmon begat Boaz</strong>, and Boaz begat Obed."</span>
                            <div class="text-xs text-amber-700 mt-1 italic">Note: Rahab is not mentioned in Ruth; Matthew adds her name from tradition or other sources (Joshua 2, 6:25).</div>
                        </li>
                        <li class="pl-3 border-l-2 border-amber-200">
                            <strong>Boaz → Obed</strong>
                             <span class="${citationLabel}">Ruth 4:21</span>
                            <span class="${quoteStyle}">"And Salmon begat Boaz, and <strong>Boaz begat Obed</strong>."</span>
                        </li>
                    </ul>
                </div>
            </div>
        `
    },
    6: {
        verseNum: 6,
        hoverQuote: "Ruth 4:22 And Obed begat Jesse, and Jesse begat David. \n2 Samuel 12:24 ...Bathsheba... bare a son, and he called his name Solomon...",
        exegesisContent: `
            <div class="font-serif">
                <h3 class="text-xl font-bold text-gray-900 mb-4 font-playfair">Jesse to Solomon</h3>
                <div class="${proofStyle}">
                    <span class="${labelStyle}">Scriptural Verification</span>
                    <ul class="space-y-4 mt-2">
                        <li class="pl-3 border-l-2 border-amber-200">
                            <strong>Jesse → David</strong>
                             <span class="${citationLabel}">Ruth 4:22</span>
                            <span class="${quoteStyle}">"And Obed begat Jesse, and <strong>Jesse begat David</strong>."</span>
                        </li>
                        <li class="pl-3 border-l-2 border-amber-200">
                            <strong>David → Solomon</strong>
                             <span class="${citationLabel}">2 Samuel 12:24</span>
                            <span class="${quoteStyle}">"And David comforted Bathsheba his wife, and went in unto her, and lay with her: and she bare a son, and he called his name <strong>Solomon</strong>: and the LORD loved him."</span>
                        </li>
                    </ul>
                </div>
            </div>
        `
    },
    7: {
        verseNum: 7,
        hoverQuote: "1 Chronicles 3:10 And Solomon's son was Rehoboam, Abia his son, Asa his son...",
        exegesisContent: `
            <div class="font-serif">
                <h3 class="text-xl font-bold text-gray-900 mb-4 font-playfair">Solomon to Asa</h3>
                <div class="${proofStyle}">
                    <span class="${labelStyle}">Scriptural Verification</span>
                     <ul class="space-y-4 mt-2">
                        <li class="pl-3 border-l-2 border-amber-200">
                            <strong>Solomon → Rehoboam</strong>
                             <span class="${citationLabel}">1 Kings 11:43</span>
                            <span class="${quoteStyle}">"And Solomon slept with his fathers... and <strong>Rehoboam his son</strong> reigned in his stead."</span>
                        </li>
                        <li class="pl-3 border-l-2 border-amber-200">
                            <strong>Rehoboam → Abijah</strong>
                             <span class="${citationLabel}">1 Kings 14:31</span>
                            <span class="${quoteStyle}">"And Rehoboam slept with his fathers... and <strong>Abijam [Abijah] his son</strong> reigned in his stead."</span>
                        </li>
                        <li class="pl-3 border-l-2 border-amber-200">
                            <strong>Abijah → Asa</strong>
                             <span class="${citationLabel}">1 Kings 15:8</span>
                            <span class="${quoteStyle}">"And Abijam slept with his fathers... and <strong>Asa his son</strong> reigned in his stead."</span>
                        </li>
                    </ul>
                </div>

                <div class="${criticalStyle}">
                    <span class="${criticalLabel}">Error: Asaph vs Asa</span>
                    <p class="${textStyle} mb-2">
                        Matthew names <strong>Asaph</strong> (a known psalmist) instead of King <strong>Asa</strong>.
                    </p>
                    <ul class="space-y-2 mt-1">
                         <li class="pl-3 border-l-2 border-red-200 text-sm">
                            <span class="font-bold text-red-700">Matthew 1:7</span>
                            <div class="italic text-gray-600">"And Abia begat <strong>Asaph</strong> [prophet/psalmist]."</div>
                        </li>
                        <li class="pl-3 border-l-2 border-green-200 text-sm">
                             <span class="font-bold text-green-700">1 Chronicles 3:10</span>
                             <div class="italic text-gray-600">"...Abia his son, <strong>Asa</strong> [king] his son..."</div>
                        </li>
                    </ul>
                    <p class="${textStyle} text-sm mt-2 font-semibold">
                        Asaph is a Levite psalmist, not a Davidic king, making this more than a trivial spelling variant.
                    </p>
                </div>
            </div>
        `
    },
    8: {
        verseNum: 8,
        hoverQuote: "1 Chronicles 3:10-11 ...Jehoshaphat his son, Joram his son... \n[Omitted: Ahaziah, Joash, Amaziah]",
        exegesisContent: `
            <div class="font-serif">
                <h3 class="text-xl font-bold text-gray-900 mb-4 font-playfair">Jehoshaphat to Uzziah</h3>
                 <div class="${proofStyle}">
                    <span class="${labelStyle}">Scriptural Verification</span>
                     <ul class="space-y-4 mt-2">
                        <li class="pl-3 border-l-2 border-amber-200">
                            <strong>Asa → Jehoshaphat</strong>
                             <span class="${citationLabel}">1 Kings 15:24</span>
                            <span class="${quoteStyle}">"And Asa slept with his fathers... and <strong>Jehoshaphat his son</strong> reigned in his stead."</span>
                        </li>
                        <li class="pl-3 border-l-2 border-amber-200">
                            <strong>Jehoshaphat → Joram</strong>
                             <span class="${citationLabel}">1 Kings 22:50</span>
                            <span class="${quoteStyle}">"And Jehoshaphat slept with his fathers... and <strong>Jehoram [Joram] his son</strong> reigned in his stead."</span>
                        </li>
                    </ul>
                </div>
                
                <div class="${criticalStyle}">
                    <span class="${criticalLabel}">Critical Omission: The Three Kings</span>
                    <p class="${textStyle} mb-2">
                        Matthew states <strong>"Joram begat Uzziah"</strong>. However, the lineage in <strong>1 Chronicles 3:11-12</strong> lists three generations between them:
                    </p>
                    <ul class="list-none space-y-2 ml-1 text-sm bg-white/50 p-3 rounded border border-red-100 inline-block font-sans w-full">
                        <li>
                            <span class="font-bold text-red-800">1. Ahaziah</span>
                            <div class="text-xs text-gray-600 block italic">"And Joram slept with his fathers... and <strong>Ahaziah his son</strong> reigned in his stead." (2 Kings 8:24)</div>
                        </li>
                        <li>
                             <span class="font-bold text-red-800">2. Joash</span>
                             <div class="text-xs text-gray-600 block italic">"In the seventh year of Jehu <strong>Jehoash [Joash] began to reign</strong>... Note: Saved as an infant." (2 Kings 12:1)</div>
                        </li>
                        <li>
                             <span class="font-bold text-red-800">3. Amaziah</span>
                             <div class="text-xs text-gray-600 block italic">"And it came to pass... Joash his father... <strong>Amaziah his son</strong> reigned in his stead." (2 Kings 14:1)</div>
                        </li>
                    </ul>
                     <p class="${textStyle} mt-2 ml-1">
                        <strong>Finally to Uzziah (Azariah):</strong> "And all the people of Judah took <strong>Azariah [Uzziah]</strong>... and made him king." (2 Kings 14:21)
                    </p>
                </div>
            </div>
        `
    },
    9: {
        verseNum: 9,
        hoverQuote: "1 Chronicles 3:12-13 ...Azariah his son, Jotham his son, Ahaz his son, Hezekiah his son...",
        exegesisContent: `
            <div class="font-serif">
                <h3 class="text-xl font-bold text-gray-900 mb-4 font-playfair">Uzziah to Hezekiah</h3>
                <div class="${proofStyle}">
                    <span class="${labelStyle}">Scriptural Verification</span>
                     <ul class="space-y-4 mt-2">
                        <li class="pl-3 border-l-2 border-amber-200">
                            <strong>Uzziah (Azariah) → Jotham</strong>
                             <span class="${citationLabel}">2 Kings 15:7</span>
                            <span class="${quoteStyle}">"And Azariah slept with his fathers... and <strong>Jotham his son</strong> reigned in his stead."</span>
                        </li>
                        <li class="pl-3 border-l-2 border-amber-200">
                            <strong>Jotham → Ahaz</strong>
                             <span class="${citationLabel}">2 Kings 15:38</span>
                            <span class="${quoteStyle}">"And Jotham slept with his fathers... and <strong>Ahaz his son</strong> reigned in his stead."</span>
                        </li>
                        <li class="pl-3 border-l-2 border-amber-200">
                            <strong>Ahaz → Hezekiah</strong>
                             <span class="${citationLabel}">2 Kings 16:20</span>
                            <span class="${quoteStyle}">"And Ahaz slept with his fathers... and <strong>Hezekiah his son</strong> reigned in his stead."</span>
                        </li>
                    </ul>
                </div>
            </div>
        `
    },
    10: {
        verseNum: 10,
        hoverQuote: "1 Chronicles 3:13-14 ...Manasseh his son, Amon his son, Josiah his son...",
        exegesisContent: `
            <div class="font-serif">
                <h3 class="text-xl font-bold text-gray-900 mb-4 font-playfair">Manasseh to Josiah</h3>
                <div class="${proofStyle}">
                    <span class="${labelStyle}">Scriptural Verification</span>
                     <ul class="space-y-4 mt-2">
                        <li class="pl-3 border-l-2 border-amber-200">
                            <strong>Hezekiah → Manasseh</strong>
                             <span class="${citationLabel}">2 Kings 20:21</span>
                            <span class="${quoteStyle}">"And Hezekiah slept with his fathers: and <strong>Manasseh his son</strong> reigned in his stead."</span>
                        </li>
                        <li class="pl-3 border-l-2 border-amber-200">
                            <strong>Manasseh → Amon</strong>
                             <span class="${citationLabel}">2 Kings 21:18</span>
                            <span class="${quoteStyle}">"And Manasseh slept with his fathers... and <strong>Amon his son</strong> reigned in his stead."</span>
                        </li>
                        <li class="pl-3 border-l-2 border-amber-200">
                            <strong>Amon → Josiah</strong>
                             <span class="${citationLabel}">2 Kings 21:24</span>
                            <span class="${quoteStyle}">"And the people of the land made <strong>Josiah his son</strong> king in his stead."</span>
                        </li>
                    </ul>
                </div>

                <div class="${criticalStyle}">
                    <span class="${criticalLabel}">Error: Amos vs Amon</span>
                    <p class="${textStyle} mb-2">
                        Matthew lists <strong>Amos</strong> (prophet) instead of King <strong>Amon</strong>.
                    </p>
                     <ul class="space-y-2 mt-1">
                         <li class="pl-3 border-l-2 border-red-200 text-sm">
                            <span class="font-bold text-red-700">Matthew 1:10</span>
                            <div class="italic text-gray-600">"And Manasses begat <strong>Amos</strong>..."</div>
                        </li>
                        <li class="pl-3 border-l-2 border-green-200 text-sm">
                             <span class="font-bold text-green-700">2 Kings 21:19</span>
                             <div class="italic text-gray-600">"<strong>Amon</strong> was twenty and two years old when he began to reign..."</div>
                        </li>
                    </ul>
                    <p class="${textStyle} text-sm mt-2">
                        Amos is a minor prophet; Amon is the king. They are distinct historical figures.
                    </p>
                </div>
            </div>
        `
    },
    11: {
        verseNum: 11,
        hoverQuote: "1 Chronicles 3:15-16 ...sons of Josiah... Jeconiah his son.",
        exegesisContent: `
             <div class="font-serif">
                <h3 class="text-xl font-bold text-gray-900 mb-4 font-playfair">The Babylonian Exile</h3>
                <div class="${proofStyle}">
                    <span class="${labelStyle}">Scriptural Verification</span>
                     <ul class="space-y-4 mt-2">
                        <li class="pl-3 border-l-2 border-amber-200">
                            <strong>Josiah → Jeconiah</strong>
                             <span class="${citationLabel}">1 Chronicles 3:15-16</span>
                            <span class="${quoteStyle}">"And the sons of Josiah... Shallum [Jehoahaz], the fourth... And the sons of Jehoiakim: <strong>Jeconiah his son</strong>."</span>
                            <p class="text-xs text-amber-800 mt-2 italic">Note: Matthew skips Jehoiakim, compressing the generation to link Josiah directly to the specific "Jeconiah" of the exile period.</p>
                        </li>
                    </ul>
                </div>

                <div class="${criticalStyle}">
                    <span class="${criticalLabel}">The Curse of Jeconiah</span>
                    <p class="${textStyle} mb-3">
                        Matthew’s genealogy passes through <strong>Jeconiah</strong>, whose line is explicitly barred from Davidic kingship by divine decree.
                    </p>
                     <div class="${quoteStyle} border-red-300 bg-red-50/50 mb-3">
                        <span class="${citationLabel} text-red-700">Jeremiah 22:30</span>
                        "Thus saith the LORD, Write ye this man childless, a man that shall not prosper in his days: <strong>for no man of his seed shall prosper, sitting upon the throne of David</strong>, and ruling any more in Judah."
                    </div>
                    <p class="${textStyle}">
                        If Jesus claims specific Davidic throne rights through Joseph's lineage, this specific ancestor disqualifies that claim under the Law and Prophets.
                    </p>
                </div>
            </div>
        `
    },
    12: {
        verseNum: 12,
        hoverQuote: "1 Chronicles 3:17-19 And the sons of Jeconiah... Salathiel... and Pedaiah... and the sons of Pedaiah were, Zerubbabel...",
        exegesisContent: `
            <div class="font-serif">
                <h3 class="text-xl font-bold text-gray-900 mb-4 font-playfair">The Restoration Line</h3>
                <div class="${proofStyle}">
                    <span class="${labelStyle}">Scriptural Verification</span>
                      <ul class="space-y-4 mt-2">
                        <li class="pl-3 border-l-2 border-amber-200">
                            <strong>Jeconiah → Shealtiel</strong>
                             <span class="${citationLabel}">1 Chronicles 3:17</span>
                            <span class="${quoteStyle}">"And the sons of Jeconiah; Assir, <strong>Salathiel his son</strong>."</span>
                        </li>
                        <li class="pl-3 border-l-2 border-amber-200">
                            <strong>Shealtiel → Zerubbabel</strong>
                             <span class="${citationLabel}">Ezra 3:2</span>
                            <span class="${quoteStyle}">"Then stood up <strong>Jeshua the son of Jozadak</strong>... and <strong>Zerubbabel the son of Shealtiel</strong>..."</span>
                            <div class="text-xs text-amber-700 mt-1 italic">Note: 1 Chr 3:19 lists Pedaiah as Zerubbabel's father, suggesting a levirate marriage or scribal complexity, but Ezra and Matthew agree on the Shealtiel patronymic.</div>
                        </li>
                    </ul>
                </div>

                <div class="${criticalStyle}">
                    <span class="${criticalLabel}">Contradiction: Zerubbabel's Paternity</span>
                    <p class="${textStyle} mb-2">
                        Matthew contradicts Chronicles regarding who Zerubbabel's father is.
                    </p>
                     <ul class="space-y-2 mt-1">
                         <li class="pl-3 border-l-2 border-red-200 text-sm">
                            <span class="font-bold text-red-700">Matthew 1:12</span>
                            <div class="italic text-gray-600">"...Salathiel begat <strong>Zorobabel</strong>"</div>
                        </li>
                        <li class="pl-3 border-l-2 border-green-200 text-sm">
                             <span class="font-bold text-green-700">1 Chronicles 3:19</span>
                             <div class="italic text-gray-600">"And the sons of <strong>Pedaiah</strong> were, Zerubbabel..."</div>
                        </li>
                    </ul>
                     <p class="${textStyle} text-sm mt-2 italic">
                        Zerubbabel is the son of Pedaiah, not Shealtiel. (Shealtiel is Pedaiah's brother).
                    </p>
                </div>
            </div>
        `
    },
    13: {
        verseNum: 13,
        hoverQuote: "Unverifiable by Old Testament\nThese names (Abiud, Eliakim, Azor) do not appear in the Hebrew Bible.",
        exegesisContent: `
            <div class="font-serif">
                <h3 class="text-xl font-bold text-gray-900 mb-4 font-playfair">Zerubbabel to Azor</h3>
                <div class="${criticalStyle}">
                    <span class="${criticalLabel}">Historical Gap</span>
                    <p class="${textStyle}">
                        Following Zerubbabel, the Old Testament historical record ends. The names <strong>Abiud, Eliakim, and Azor</strong> are unknown to Chronicles, Ezra, or Nehemiah.
                    </p>
                    <p class="${textStyle} mt-2 italic text-sm">
                        Total Scriptural Silence: No text connects Zerubbabel to an "Abiud".
                    </p>
                </div>
            </div>
        `
    },
    14: {
        verseNum: 14,
        hoverQuote: "Unverifiable by Old Testament\nThese names (Sadoc, Achim, Eliud) do not appear in the Hebrew Bible.",
        exegesisContent: `
            <div class="font-serif">
                <h3 class="text-xl font-bold text-gray-900 mb-4 font-playfair">Azor to Eliud</h3>
                 <div class="${criticalStyle}">
                    <span class="${criticalLabel}">Unverified Period</span>
                     <p class="${textStyle}">
                        <strong>Sadoc, Achim, Eliud:</strong> These individuals fall within the "Intertestamental Period" (400 BC - 4 BC). There is no external textual evidence (Josephus, Apocrypha, or OT) for this specific lineage sequence.
                    </p>
                </div>
            </div>
        `
    },
    15: {
        verseNum: 15,
        hoverQuote: "Unverifiable by Old Testament\nEleazar, Matthan, and Jacob do not appear in the Hebrew Bible.",
        exegesisContent: `
             <div class="font-serif">
                <h3 class="text-xl font-bold text-gray-900 mb-4 font-playfair">Eliud to Jacob</h3>
                <div class="${criticalStyle}">
                    <span class="${criticalLabel}">Unverified Period</span>
                    <p class="${textStyle}">
                        <strong>Matthan & Jacob:</strong> This genealogy tracks a separate line from Luke 3, which lists <em>Matthat</em> and <em>Heli</em> in parallel positions.
                    </p>
                </div>
            </div>
        `
    },
    16: {
        verseNum: 16,
        hoverQuote: "Unverifiable by Old Testament (Jacob to Joseph connection)\nThough Joseph is Davidic, the specific link via Jacob differs from Luke's genealogy (via Heli).\n\nProphecy: Isaiah 7:14 ...Behold, a virgin shall conceive...",
        exegesisContent: `
            <div class="font-serif">
                <h3 class="text-xl font-bold text-gray-900 mb-4 font-playfair">The Birth of Jesus</h3>
                
                <div class="${criticalStyle}">
                    <span class="${criticalLabel}">The Genealogical Divergence</span>
                    <p class="${textStyle} mb-2">
                        <strong>Matthew:</strong> Jacob → Joseph.
                    </p>
                    <p class="${textStyle}">
                        <strong>Luke:</strong> Heli → Joseph.
                    </p>
                </div>

                <div class="bg-slate-50 p-5 rounded border border-slate-200 mb-4">
                    <span class="block text-sm font-sans font-bold uppercase tracking-widest text-slate-700 mb-3">Sidebar Exegesis: Key Points</span>
                    <ul class="space-y-4 mt-2">
                        <li class="${textStyle} pl-3 border-l-4 border-slate-300">
                            <strong>Matthew explicitly breaks the genealogical chain:</strong> the Greek relative pronoun <em>hēs</em> (“of whom,” feminine singular) refers to Mary alone, not Joseph, marking Jesus as outside Joseph’s biological line.
                        </li>
                         <li class="${textStyle} pl-3 border-l-4 border-slate-300">
                            <strong>Davidic kingship requires physical descent:</strong> biblical covenant language repeatedly specifies descent from David’s own “seed” or “body” (e.g., 2 Sam 7:12; Ps 132:11), not legal guardianship.
                        </li>
                         <li class="${textStyle} pl-3 border-l-4 border-slate-300">
                            <strong>Jewish genealogies establish biological lineage, not adoption:</strong> in biblical and Second Temple sources, tribal and royal status depends on paternal descent; there is no precedent for adoption or stepfatherhood conferring kingship.
                        </li>
                         <li class="${textStyle} pl-3 border-l-4 border-slate-300">
                            <strong>Covenant inclusion does not override genealogy:</strong> Ezra–Nehemiah excludes individuals from priestly roles despite covenantal belonging when lineage cannot be proven, showing that legal or communal status cannot substitute for descent.
                        </li>
                    </ul>
                    <div class="mt-5 pt-4 border-t border-slate-200">
                        <p class="${textStyle} font-semibold text-slate-900">
                            Matthew 1:16 simultaneously denies Joseph’s paternity and relies on Joseph’s genealogy, rendering Joseph incapable of transmitting Davidic descent to Jesus.
                        </p>
                    </div>
                </div>
            </div>
        `
    },
    17: {
        verseNum: 17,
        hoverQuote: "So all the generations from Abraham to David are fourteen generations...",
        exegesisContent: `
             <div class="font-serif">
                <h3 class="text-xl font-bold text-gray-900 mb-4 font-playfair">Structure & Integrity</h3>
                
                <div class="${proofStyle}">
                    <span class="${labelStyle}">The Forced 14-14-14 Pattern</span>
                    <p class="${textStyle} mb-3">
                        The author structures this genealogy around the number 14 (the gematria value of David's name in Hebrew: דוד = 4+6+4) to present Jesus as the Davidic Messiah. However, this pattern requires significant manipulation:
                    </p>
                     <ul class="list-disc ml-5 space-y-2 text-gray-800">
                        <li><strong>Three kings omitted</strong> between Joram and Uzziah: Ahaziah, Joash, and Amaziah.</li>
                        <li><strong>Jeconiah double-counted</strong> at the exile boundary to reach 14 in the third section.</li>
                        <li><strong>Nine post-exilic names</strong> (Abiud through Jacob) have no Old Testament attestation.</li>
                        <li>The genealogy spans exactly 14 verses (2-16), suggesting deliberate literary construction.</li>
                    </ul>
                </div>

                <div class="${criticalStyle}">
                    <span class="${criticalLabel}">Fatal Genealogical Issue</span>
                    <p class="${textStyle}">
                        Both Matthew and Luke trace through Joseph, yet both Gospels affirm Joseph is not Jesus's biological father (virgin birth narrative, Matthew 1:18-25). Under Torah law, <strong>covenant status requires biological descent</strong>—adoption cannot transfer Davidic lineage (Genesis 15:4 explicitly rejects non-biological heirs; Numbers 1:18 requires genealogy through biological birth).
                    </p>
                </div>

                 <div class="bg-amber-50 p-5 rounded border-l-4 border-amber-600 mb-4">
                    <span class="block text-sm font-sans font-bold uppercase tracking-widest text-amber-800 mb-3">The Evidence for Aaron's Line</span>
                    <p class="${textStyle}">
                        Biblical evidence indicates that Jesus’ only traceable genealogy runs through Mary, and that lineage is <strong>priestly, not royal</strong>.
                    </p>
                    <p class="${textStyle} mt-3">
                        Luke identifies Mary as Elizabeth’s <em>syngenēs</em> (“relative,” Luke 1:36), while explicitly stating that Elizabeth is “from the daughters of Aaron” (Luke 1:5). In Second Temple usage, kinship terms denote shared ancestral descent, not mere social or marital relation.
                    </p>
                    <p class="${textStyle} mt-3">
                        The Quran independently preserves this same tradition by identifying Mary as the “sister of Aaron” (Q 19:28), a recognized Semitic idiom for tribal affiliation, not literal siblinghood. Since Matthew explicitly denies Joseph’s paternity (Matt 1:16), Davidic descent through Joseph is genealogically void, leaving Mary as the sole biological line.
                    </p>
                     <p class="${textStyle} mt-3 italic text-sm">
                        The cumulative evidence therefore points to Levitical descent through Aaron, aligning Jesus with the priestly messiah attested in the Dead Sea Scrolls (e.g., 1QS; 1QSa).
                    </p>
                </div>
            </div>
        `
    },
    18: {
        verseNum: 18,
        hoverQuote: "Now the birth of Jesus Christ was on this wise: When as his mother Mary was espoused to Joseph...",
        exegesisContent: `
            <div class="font-serif">
                <h3 class="text-xl font-bold text-gray-900 mb-4 font-playfair">Conception & Guardianship</h3>
                <div class="${proofStyle}">
                    <span class="${labelStyle}">Comparison with Quranic Account</span>
                    <p class="${textStyle} mb-3">
                        The Quran explicitly affirms Mary’s virgin conception while presenting a social framework that differs from Matthew’s account.
                    </p>
                    <ul class="list-disc ml-5 space-y-2 text-gray-800 mb-3 text-lg leading-relaxed">
                        <li><strong>Sanctuary Guardianship:</strong> Mary is placed under the guardianship of Zechariah, chosen by lots, and resides in a sacred sanctuary (miḥrāb) rather than under the care of a fiancé (Q 3:37, 3:44).</li>
                        <li><strong>Divine Action:</strong> When Mary questions conception without a man, the response attributes it to God "breathing into her" of His Spirit (Q 3:47; 19:20–21; 21:91).</li>
                        <li><strong>Solitary Birth:</strong> Mary withdraws to an eastern place and gives birth alone, with no husband or betrothed present (Q 19:16, 22–23).</li>
                    </ul>
                     <p class="${textStyle} mt-2 italic text-base">
                        Thus, while the Quran confirms non-sexual conception through the Holy Spirit, it differs from Matthew's depiction of Mary within a marital guardianship framework.
                    </p>
                </div>
            </div>
        `
    },
    19: {
        verseNum: 19,
        hoverQuote: "Then Joseph her husband, being a just man, and not willing to make her a public example...",
        exegesisContent: `
            <div class="font-serif">
                <h3 class="text-xl font-bold text-gray-900 mb-4 font-playfair">Joseph's Dilemma</h3>
                <div class="${criticalStyle}">
                    <span class="${criticalLabel}">Legal Inconsistency</span>
                     <p class="${textStyle} mb-3">
                        From a Second Temple Jewish standpoint, Joseph’s reaction is difficult to reconcile with the law. If Joseph believed Mary was pregnant, the only reasonable conclusion was sexual transgression.
                    </p>
                    <p class="${textStyle} mb-3">
                        Under Torah law, adultery was a capital offense (Deut 22:23–24). If she belonged to a priestly family, the penalty was severe: "the daughter of a priest, if she profanes herself by whoring... shall be burned with fire" (Lev 21:9).
                    </p>
                     <p class="${textStyle} font-semibold">
                        In this legal context, Joseph’s decision to quietly conceal the matter rather than report it does not reflect legal righteousness but avoidance of the law’s demands.
                    </p>
                </div>
            </div>
        `
    },
    20: {
        verseNum: 20,
        hoverQuote: "But while he thought on these things, behold, the angel of the Lord appeared unto him in a dream...",
        exegesisContent: `
             <div class="font-serif">
                <h3 class="text-xl font-bold text-gray-900 mb-4 font-playfair">Dream Validation</h3>
                <div class="${proofStyle}">
                    <span class="${labelStyle}">Legitimizing Device</span>
                    <p class="${textStyle} mb-3">
                        The problem of pregnancy is resolved not through law but through private revelation. Dreams function in Matthew as a legitimizing device, granting Joseph knowledge unavailable within ordinary Jewish legal reasoning.
                    </p>
                    <p class="${textStyle} mb-3">
                        Matthew addresses Joseph as "son of David," a deliberate rhetorical insertion to keep Davidic lineage in view, even though Joseph’s genealogy has no biological bearing on Jesus (1:16).
                    </p>
                    <p class="${textStyle}">
                        The dream serves to preserve Mary’s honor and advance theological aims, while the appeal to David operates symbolically rather than genealogically.
                    </p>
                </div>
            </div>
        `
    },
    21: {
        verseNum: 21,
        hoverQuote: "And she shall bring forth a son, and thou shalt call his name JESUS: for he shall save his people from their sins.",
        exegesisContent: `
            <div class="font-serif">
                <h3 class="text-xl font-bold text-gray-900 mb-4 font-playfair">The Name of Jesus</h3>
                <div class="${proofStyle}">
                    <span class="${labelStyle}">Yeshua: "YHWH Saves"</span>
                    <p class="${textStyle} mb-3">
                        "Jesus" is the Greek form (<em>Iēsous</em>) of the Hebrew <strong>Yehōshuaʿ / Yeshua</strong> (יהושע), meaning "YHWH saves." This name recalls Joshua son of Nun, who led Israel into the land.
                    </p>
                     <p class="${textStyle} mb-3">
                        For Jews of this period, "saving people from sins" was tied to repentance, covenant faithfulness, and the Temple cult (Day of Atonement)—never the potential death of a messianic figure, which would have been antithetical to the Davidic expectation.
                    </p>
                    <p class="${textStyle} text-sm italic">
                        By the time Matthew was written, Pauline atonement theology had circulated for decades, suggesting the author writes with this inherited framework rather than a purely Second Temple Jewish one.
                    </p>
                </div>
            </div>
        `
    },
    22: {
        verseNum: 22,
        hoverQuote: "Now all this was done, that it might be fulfilled which was spoken of the Lord by the prophet...",
        exegesisContent: `
            <div class="font-serif">
                <h3 class="text-xl font-bold text-gray-900 mb-4 font-playfair">The Prophetic Claim</h3>
                <div class="${criticalStyle}">
                    <span class="${criticalLabel}">Translation vs. Original Text</span>
                    <p class="${textStyle} mb-3">
                        Matthew’s appeal to prophecy rests on a translation choice inherited from the Greek Septuagint rather than the Hebrew text itself.
                    </p>
                    <ul class="list-disc ml-5 space-y-2 text-gray-800 mb-3 text-lg">
                        <li><strong>Hebrew (Isaiah 7:14):</strong> Uses <em>ʿalmāh</em> (עַלְמָה), meaning "young woman."</li>
                        <li><strong>Hebrew (Virgin):</strong> When virginity is intended, the term is <em>bĕtūlāh</em> (בְּתוּלָה).</li>
                        <li><strong>Septuagint (Greek):</strong> Renders <em>ʿalmāh</em> as <em>parthenos</em> ("virgin"), introducing a semantic shift.</li>
                    </ul>
                    <p class="${textStyle} mt-2">
                        In its original context, Isaiah 7 refers to a child born in King Ahaz's time as a sign of imminent political deliverance. Reliance on the Greek mistranslation suggests an author removed from the Hebrew textual tradition.
                    </p>
                </div>
                 <div class="bg-gray-50 p-4 rounded border border-gray-200">
                    <span class="block text-xs font-sans font-bold uppercase tracking-widest text-gray-600 mb-2">Hebrew Usage of ʿAlmāh</span>
                    <ul class="space-y-2 text-sm text-gray-700">
                        <li><strong>Gen 24:43:</strong> Rebekah called <em>ʿalmāh</em> (young woman); previously <em>bĕtūlāh</em> (virgin).</li>
                        <li><strong>Ex 2:8:</strong> Miriam called <em>ʿalmāh</em> (young girl).</li>
                        <li><strong>Prov 30:19:</strong> "Way of a man with an <em>ʿalmāh</em>" (implies romance/courtship).</li>
                    </ul>
                </div>
            </div>
        `
    },
    23: {
        verseNum: 23,
        hoverQuote: "Behold, a virgin shall be with child, and shall bring forth a son, and they shall call his name Emmanuel...",
        exegesisContent: `
             <div class="font-serif">
                <h3 class="text-xl font-bold text-gray-900 mb-4 font-playfair">The Prophetic Claim</h3>
                <div class="${criticalStyle}">
                    <span class="${criticalLabel}">Translation vs. Original Text</span>
                    <p class="${textStyle} mb-3">
                        Matthew’s appeal to prophecy rests on a translation choice inherited from the Greek Septuagint rather than the Hebrew text itself.
                    </p>
                    <ul class="list-disc ml-5 space-y-2 text-gray-800 mb-3 text-lg">
                        <li><strong>Hebrew (Isaiah 7:14):</strong> Uses <em>ʿalmāh</em> (עַלְמָה), meaning "young woman."</li>
                        <li><strong>Hebrew (Virgin):</strong> When virginity is intended, the term is <em>bĕtūlāh</em> (בְּתוּלָה).</li>
                        <li><strong>Septuagint (Greek):</strong> Renders <em>ʿalmāh</em> as <em>parthenos</em> ("virgin"), introducing a semantic shift.</li>
                    </ul>
                    <p class="${textStyle} mt-2">
                        In its original context, Isaiah 7 refers to a child born in King Ahaz's time as a sign of imminent political deliverance. Reliance on the Greek mistranslation suggests an author removed from the Hebrew textual tradition.
                    </p>
                </div>
                 <div class="bg-gray-50 p-4 rounded border border-gray-200">
                    <span class="block text-xs font-sans font-bold uppercase tracking-widest text-gray-600 mb-2">Hebrew Usage of ʿAlmāh</span>
                    <ul class="space-y-2 text-sm text-gray-700">
                        <li><strong>Gen 24:43:</strong> Rebekah called <em>ʿalmāh</em> (young woman); previously <em>bĕtūlāh</em> (virgin).</li>
                        <li><strong>Ex 2:8:</strong> Miriam called <em>ʿalmāh</em> (young girl).</li>
                        <li><strong>Prov 30:19:</strong> "Way of a man with an <em>ʿalmāh</em>" (implies romance/courtship).</li>
                    </ul>
                </div>
            </div>
        `
    },
    24: {
        verseNum: 24,
        hoverQuote: "Then Joseph being raised from sleep did as the angel of the Lord had bidden him, and took unto him his wife:",
        exegesisContent: `
            <div class="font-serif">
                <h3 class="text-xl font-bold text-gray-900 mb-4 font-playfair">Obedience & Legitimacy</h3>
                <div class="${proofStyle}">
                    <span class="${labelStyle}">Social vs. Biological Lineage</span>
                    <p class="${textStyle} mb-3">
                        Joseph’s actions reflect obedience to divine instruction rather than resolution of legal tensions. By taking Mary as his wife, he publicly legitimizes the pregnancy and shields her from suspicion.
                    </p>
                    <p class="${textStyle} mb-3">
                        The marriage functions socially—integrating the child into a recognized household—but not genealogically, since no biological lineage is transferred and the narrative expressly denies his paternity.
                    </p>
                     <p class="${textStyle}">
                        Matthew presents Joseph’s righteousness as submission to revelation rather than adherence to strict Torah procedure, reinforcing a tendency to subordinate legal norms for theological aims.
                    </p>
                </div>
            </div>
        `
    },
    25: {
        verseNum: 25,
        hoverQuote: "And knew her not till she had brought forth her firstborn son: and he called his name JESUS.",
        exegesisContent: `
             <div class="font-serif">
                <h3 class="text-xl font-bold text-gray-900 mb-4 font-playfair">Obedience & Legitimacy</h3>
                <div class="${proofStyle}">
                    <span class="${labelStyle}">Social vs. Biological Lineage</span>
                    <p class="${textStyle} mb-3">
                        Joseph’s actions reflect obedience to divine instruction rather than resolution of legal tensions. By taking Mary as his wife, he publicly legitimizes the pregnancy and shields her from suspicion.
                    </p>
                    <p class="${textStyle} mb-3">
                        The marriage functions socially—integrating the child into a recognized household—but not genealogically, since no biological lineage is transferred and the narrative expressly denies his paternity.
                    </p>
                     <p class="${textStyle}">
                        Matthew presents Joseph’s righteousness as submission to revelation rather than adherence to strict Torah procedure, reinforcing a tendency to subordinate legal norms for theological aims.
                    </p>
                </div>
            </div>
        `
    }
};
