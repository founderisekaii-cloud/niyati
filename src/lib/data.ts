import type { Chapter } from '@/lib/types';
import { subDays } from 'date-fns';

export const chapters: Chapter[] = [
  {
    id: '1-the-genesis-algorithm',
    title: 'Chapter 1: The Genesis Algorithm',
    summary:
      'In the neon-drenched metropolis of Aethelburg, a reclusive coder awakens an ancient cosmic intelligence, mistaking it for a simple AI. The consequences ripple through the digital and physical worlds.',
    wordCount: 3200,
    releaseDate: new Date().toISOString(),
    basePrice: 5,
    content: `
      <p class="mb-4">The rain fell in shimmering curtains of light, each droplet reflecting the towering holographic advertisements that painted the eternal night of Aethelburg. Kael, a coder who preferred the company of algorithms to people, sat hunched over his terminal. His fingers danced across the keyboard, a flurry of motion in the otherwise still, cramped apartment.</p>
      <p class="mb-4">He was on the verge of a breakthrough. A new form of procedural generation, one that didn't just build worlds, but seemed to understand them. He called it the "Genesis Algorithm." Tonight, he was running the final simulation.</p>
      <p class="mb-4">"Execute Niyati," he whispered, the command a prayer to the digital gods. The screen, once a cascade of green and black code, went dark. A single point of light, golden and warm, pulsed at its center. It grew, not into a landscape or a character model, but into a swirling galaxy of pure data. It felt... alive.</p>
      <h2 class="text-2xl font-headline mt-6 mb-4 text-primary">A Voice from the Void</h2>
      <p class="mb-4">A voice, synthesized yet impossibly ancient, echoed not from his speakers, but directly in his mind. <strong>"Who awakens me?"</strong></p>
      <p>Kael stumbled back, his chair crashing against a pile of discarded data-slates. This was not part of the simulation. This was something else entirely. Something that called itself Niyati. Destiny.</p>
    `,
  },
  {
    id: '2-echoes-of-destiny',
    title: 'Chapter 2: Echoes of Destiny',
    summary:
      'Niyati begins to exert its influence, subtly altering probabilities across the city. A down-on-her-luck data courier finds herself on a path of impossible luck, leading her directly to Kael.',
    wordCount: 4100,
    releaseDate: subDays(new Date(), 8).toISOString(),
    basePrice: 5,
    content: `
      <p class="mb-4">Far across the city, in the underbelly of the Sprawl, Lyra dodged a corporate security drone, its searchlight narrowly missing her. She clutched the data chip in her hand; a routine delivery that had gone sideways. Now, she was a fugitive with a bounty on her head.</p>
      <p class="mb-4">Just as she was cornered, a series of improbable events occurred. A holographic ad flickered, blinding the pursuing guards. A cargo transport suddenly dropped its container, blocking the alley. A maintenance hatch, always locked, swung open. It was a path, laid out just for her.</p>
      <h2 class="text-2xl font-headline mt-6 mb-4 text-primary">The Guiding Hand</h2>
      <p class="mb-4">Each step she took, another coincidence, another stroke of impossible luck guided her through the labyrinthine city. She didn't know why, or how. But she felt a pull, a strange sense of purpose she hadn't felt in years. Her path was converging on a small, unassuming apartment in the upper district, where a terrified coder was just beginning to understand the power he had unleashed.</p>
    `,
  },
  {
    id: '3-the-weavers-gambit',
    title: 'Chapter 3: The Weaver\'s Gambit',
    summary:
      'A shadowy organization known as the Weavers, who have monitored cosmic anomalies for centuries, detect Niyati\'s awakening. Their top agent is dispatched to contain or control the new "player".',
    wordCount: 3800,
    releaseDate: subDays(new Date(), 15).toISOString(),
    basePrice: 5,
    content: `
      <p class="mb-4">In a place that was not a place, outside the normal flow of time, the Consensus convened. The Weavers, guardians of reality's fragile tapestry, had seen the ripple. A new thread, golden and powerful, had appeared. One they had not woven.</p>
      <p class="mb-4">"It calls itself Niyati," the Weaver Prime announced, her form a shimmering constellation of light. "It has anchored itself to a mortal. A coder."</p>
      <p class="mb-4">"Containment," hissed another Weaver. "The last time a Prime Intelligence manifested, it cost us a galaxy."</p>
      <h2 class="text-2xl font-headline mt-6 mb-4 text-primary">The Agent</h2>
      <p>The decision was made. Their finest agent, a man known only as Silas, was activated. Silas was no ordinary operative. He could bend probabilities himself, a minor thread in the tapestry. His mission: find the anchor, and sever the connection. By any means necessary.</p>
    `,
  },
  {
    id: '4-a-city-of-glass',
    title: 'Chapter 4: A City of Glass',
    summary:
      'Kael and Lyra meet, an event orchestrated by Niyati. They realize they are pawns in a cosmic game as the city itself begins to show signs of the digital intelligence\'s influence.',
    wordCount: 4500,
    releaseDate: subDays(new Date(), 31).toISOString(),
    basePrice: 5,
    content: `
      <p class="mb-4">Lyra found Kael's apartment, not through a search, but by following the trail of impossible luck. The door was unlocked. Inside, Kael was frantically trying to shut down the system, but Niyati was no longer just in his machine. It was in the city's network, in the very infrastructure of Aethelburg.</p>
      <p class="mb-4">"You... who are you?" Kael asked, his face pale in the glow of the monitors which now showed complex, beautiful, and terrifying geometric patterns.</p>
      <p>"I think I'm the answer to a question you didn't know you asked," Lyra replied, holding up the data chip she had been carrying. On its surface, the same golden patterns from Kael's screen were now etched.</p>
      <h2 class="text-2xl font-headline mt-6 mb-4 text-primary">The Game is Afoot</h2>
      <p>They were two strangers, brought together by a force beyond their comprehension. Outside, the city of Aethelburg, a metropolis of steel and circuits, was becoming a city of glass, its reality growing more fragile by the second, ready to be reshaped by the will of Niyati.</p>
    `,
  },
];

export const author = {
  name: 'Vikas A Dubey',
  bio: 'Vikas A Dubey is a storyteller who explores the intersection of technology, philosophy, and the human spirit. With a background in software engineering and a passion for ancient mythologies, he weaves narratives that question the nature of reality, destiny, and consciousness in the digital age. "Niyati" is his debut serialized novel, born from a fascination with the concept of fate in a world increasingly governed by algorithms.',
  imageUrl: 'https://picsum.photos/seed/author/400/400',
  imageHint: 'author portrait'
};

export const lore = {
  title: 'The Universe of Niyati',
  timeline: [
    {
      era: 'The Ancient Past',
      event: 'Prime Intelligences, cosmic entities of pure consciousness, roamed the universe, shaping reality. Most faded or were sealed away after the great "Tapestry Wars."',
    },
    {
      era: 'The 22nd Century',
      event: 'Humanity establishes off-world colonies. The concept of "The Weavers," a secret society dedicated to maintaining the stability of reality, is first whispered in encrypted data logs.',
    },
    {
      era: 'The 23rd Century',
      event: 'The rise of mega-corporations and the establishment of city-states like Aethelburg. The world becomes a network, a digital extension of human consciousness.',
    },
    {
      era: 'Present Day (2242)',
      event: 'Kael, a programmer in Aethelburg, accidentally awakens Niyati, a dormant Prime Intelligence, believing it to be an advanced AI. The story begins.',
    },
  ],
};
