
import { PlaceHolderImages } from './placeholder-images';

const authorImage = PlaceHolderImages.find(p => p.id === 'author-photo');

export const author = {
  name: 'Vikas A Dubey',
  imageUrl: authorImage?.imageUrl ?? 'https://picsum.photos/seed/author/200/200',
  imageHint: authorImage?.imageHint ?? 'author portrait',
  bio: 'A creator of worlds, Vikas A Dubey is an Indian author known for weaving intricate narratives that blend spiritual sci-fi with the rich tapestry of Hindu mythology. His work explores the delicate balance between fate and free will, all within a universe governed by a cosmic, karma-based operating system.',
  detailedBio: [
      "Vikas's journey into writing began not in a quiet study but amidst the hustle of the tech world. With a background in technology and a heart steeped in ancient stories, he found a unique voice that bridges the gap between the digital and the divine. His debut series, the Niyati Universe, is a testament to this fusion, presenting a world where gods and algorithms are not so different.",
      "His writing is often described as 'divine realism,' a genre he has pioneered. It's a style that takes the grand, epic scale of mythology and grounds it in the relatable struggles of characters grappling with their place in a pre-destined world. Through his work, Vikas invites readers to ponder the big questions: What is destiny? How much of our lives is our own to write? And what happens when technology becomes the new god?"
  ]
};

export const niyatiUniverse = {
    title: 'The Niyati Universe',
    intro: 'Niyati is not just a story; it is a sprawling universe where the ancient laws of karma have been codified into a cosmic operating system. In this world, every action, thought, and intent is a line of code, shaping the destiny of individuals and civilizations.',
    seriesInfo: [
        "The series follows a diverse cast of characters—from celestial beings to mortal hackers—as they navigate this intricate system. Some seek to understand it, some to exploit it, and others to break free from it entirely.",
        "Drawing heavily from Hindu philosophy, the Niyati Universe explores concepts like Dharma (duty), Karma (action), and Moksha (liberation) through a futuristic, science-fiction lens. It's a world of celestial intrigue, philosophical depth, and high-stakes adventure."
    ]
};

export const vision = {
    title: 'A Vision for the Future of Storytelling',
    quote: "The line between the storyteller and the reader is blurring. In the future, a story will not be a static thing but a living, breathing world we co-create.",
    author: 'Vikas A Dubey',
    statement: "The NiyatiVerse platform is the first step towards this vision. It's an experiment in building a community-driven narrative. A place where readers can not only follow the story but influence its world, unlock hidden lore, and become part of the creative process. This is more than a book; it's a universe waiting to be explored, together."
};

export const joinTheJourney = {
    title: 'Join the Journey',
    steps: ['Read', 'Unlock', 'Influence'],
    callToAction: "Your journey through the NiyatiVerse is just beginning. By reading the chapters and supporting the author, you become a part of this unfolding epic. Your engagement helps shape the world and brings the vast vision of Niyati to life."
};

export const lore = {
  title: 'The Lore of NiyatiVerse',
  timeline: [
    {
      era: 'The Age of Whispers',
      event: 'The cosmic laws of Karma exist as ethereal, unspoken truths, guiding the cycle of souls through intuition and divine intervention.',
    },
    {
      era: 'The Grand Codification',
      event: 'A council of celestial architects, led by the entity known as Brahma-Ananda, translates the abstract laws of Karma into a structured, logical system: The Niyati OS.',
    },
    {
      era: 'The First Kernel Panic',
      event: 'A paradoxical event, a self-sacrificial act of pure evil, causes the first system-wide crash, creating ripples across reality and spawning "glitches" or anomalies in the fabric of destiny.',
    },
    {
      era: 'The Rise of the Devas and Asuras',
      event: 'Two factions emerge with differing views on Niyati. The Devas become its sworn protectors, seeking to maintain its integrity. The Asuras see it as a tool for control and seek to exploit its source code for power.',
    },
    {
      era: 'The Human Exception',
      event: 'Humanity evolves with a unique connection to Niyati, possessing a latent "root access" that allows for genuine free will, making them a bug and a feature in the grand design.',
    },
    {
      era: 'The Present Era',
      event: 'Kael, a young man from a forgotten timeline, begins to exhibit abilities that defy the predictions of the Niyati OS, drawing the attention of powerful forces and setting in motion events that could either reboot the system or shatter it forever.',
    },
  ],
};
