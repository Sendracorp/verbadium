'use client';
import CourseFamilyCard, { type FamilyCardData } from './CourseFamilyCard';
import { useOwnedCourses } from '@/lib/use-owned-courses';

/* Renders the catalog cards on the static homepage, upgrading a card to its
   "owned / continue" state client-side for signed-in owners (the page itself
   stays statically rendered for a fast LCP). */
export default function Catalog({ cards }: { cards: FamilyCardData[] }) {
  const owned = useOwnedCourses();
  return (
    <>
      {cards.map(card => {
        const merged: FamilyCardData = {
          ...card,
          variants: card.variants.map(v => {
            const o = owned[v.slug];
            return o ? { ...v, owns: true, passed: o.passed } : v;
          }),
        };
        return <CourseFamilyCard key={card.family} card={merged} />;
      })}
    </>
  );
}
