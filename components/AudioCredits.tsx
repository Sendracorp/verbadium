/* CC BY-SA attribution for the native-speaker recordings. Names are passed in
   (computed server-side) so the 19 KB audio manifest stays out of the client. */
export default function AudioCredits({ names }: { names: string[] }) {
  if (!names.length) return null;
  return (
    <p className="note audio-credits">
      Native-speaker recordings from{' '}
      <a href="https://lingualibre.org" target="_blank" rel="noopener">Lingua Libre</a> /{' '}
      Wikimedia Commons, licensed{' '}
      <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a>.
      Recorded by {names.join(', ')}. Moltes gràcies!
    </p>
  );
}
