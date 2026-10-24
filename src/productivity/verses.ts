// RV1909 public-domain source text. Other interface languages use explicitly
// labelled, original short adaptations rather than claiming a published edition.
export const VERSES=[
 {reference:'Proverbs 16:3',text:'Encomienda á Jehová tus obras, y tus pensamientos serán afirmados.',adaptation:'Commit your work to the Lord, and your plans will be established.',url:'https://ebible.org/spaRV1909/PRO16.htm#V3'},
 {reference:'Philippians 4:13',text:'Todo lo puedo en Cristo que me fortalece.',adaptation:'I can do all things through Christ who strengthens me.',url:'https://ebible.org/spaRV1909/PHP04.htm#V13'},
 {reference:'Proverbs 3:6',text:'Reconócelo en todos tus caminos, y él enderezará tus veredas.',adaptation:'Acknowledge God in all your ways, and he will guide your paths.',url:'https://ebible.org/spaRV1909/PRO03.htm#V6'},
 {reference:'Psalm 46:10',text:'Estad quietos, y conoced que yo soy Dios.',adaptation:'Be still, and know that I am God.',url:'https://ebible.org/spaRV1909/PSA046.htm#V10'},
 {reference:'1 Thessalonians 5:16',text:'Estad siempre gozosos.',adaptation:'Rejoice always.',url:'https://ebible.org/spaRV1909/1TH05.htm#V16'},
 {reference:'1 Thessalonians 5:21',text:'Examinadlo todo; retened lo bueno.',adaptation:'Test everything; hold on to what is good.',url:'https://ebible.org/spaRV1909/1TH05.htm#V21'},
 {reference:'Galatians 6:9',text:'No nos cansemos, pues, de hacer bien; que á su tiempo segaremos, si no hubiéremos desmayado.',adaptation:'Let us not grow tired of doing good; in due time we will reap if we persevere.',url:'https://ebible.org/spaRV1909/GAL06.htm#V9'},
 {reference:'Proverbs 16:24',text:'Panal de miel son los dichos suaves: suavidad al alma y medicina á los huesos.',adaptation:'Kind words are like honey: sweetness to the soul and healing to the body.',url:'https://ebible.org/spaRV1909/PRO16.htm#V24'},
 {reference:'Proverbs 3:13',text:'Bienaventurado el hombre que halla la sabiduría, y que obtiene la inteligencia.',adaptation:'Blessed is the person who finds wisdom and gains understanding.',url:'https://ebible.org/spaRV1909/PRO03.htm#V13'},
 {reference:'1 Thessalonians 5:11',text:'Consolaos los unos á los otros, y edificaos los unos á los otros.',adaptation:'Encourage one another and build each other up.',url:'https://ebible.org/spaRV1909/1TH05.htm#V11'},
 {reference:'Galatians 6:2',text:'Sobrellevad los unos las cargas de los otros; y cumplid así la ley de Cristo.',adaptation:'Carry one another’s burdens, and so fulfill the law of Christ.',url:'https://ebible.org/spaRV1909/GAL06.htm#V2'},
 {reference:'Philippians 4:4',text:'Gozaos en el Señor siempre: otra vez digo: Que os gocéis.',adaptation:'Rejoice in the Lord always; again, rejoice.',url:'https://ebible.org/spaRV1909/PHP04.htm#V4'},
] as const
export function verseForDate(date:string){
 const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
 if(!match)throw new Error('Invalid calendar date')
 const utc=new Date(`${date}T12:00:00Z`);if(!Number.isFinite(utc.getTime())||utc.toISOString().slice(0,10)!==date)throw new Error('Invalid calendar date')
 const ordinal=Math.floor(utc.getTime()/86400000)
 // Coprime step gives a shuffled 12-day rotation, stable on rerender and reload.
 return VERSES[((ordinal*5+7)%VERSES.length+VERSES.length)%VERSES.length]
}
