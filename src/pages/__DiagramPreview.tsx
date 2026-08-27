import * as D from '@/components/academy/patternDiagrams';
export default function DiagramPreview() {
  const items: Array<[string, JSX.Element]> = [
    ['DoubleTop', <D.DoubleTop />], ['DoubleBottom', <D.DoubleTop flip />],
    ['TripleTop', <D.TripleTop />], ['HeadShoulders', <D.HeadShoulders />], ['HSInv', <D.HeadShoulders flip />],
    ['Diamond', <D.Diamond />], ['DiamondBottom', <D.Diamond flip />],
    ['TriDesc', <D.DirectionalTriangle />], ['TriAsc', <D.DirectionalTriangle flip />],
    ['Channel', <D.ChannelIntoLevel />], ['ChannelFlip', <D.ChannelIntoLevel flip />],
    ['Rounded', <D.RoundedBottom />], ['WedgeDesc', <D.Wedge />], ['WedgeAsc', <D.Wedge flip />],
    ['FlagBull', <D.Flag />], ['FlagBear', <D.Flag flip />],
    ['PennantBull', <D.Pennant />], ['PennantBear', <D.Pennant flip />],
    ['SymTri', <D.SymmetricTriangle />], ['Pivot', <D.Pivot />], ['FalseBreak', <D.FalseBreak />],
    ['FibExt', <D.FibExtension />], ['FibExtShort', <D.FibExtension flip />],
    ['FibRet', <D.FibRetracement />], ['FibRetFlip', <D.FibRetracement flip />],
    ['FalseBreakTri', <D.FalseBreakTriangle />], ['ChannelMirror', <D.ChannelMirror />], ['SuccMirror', <D.SuccessiveMirror />],
  ];
  return (
    <div className="dark bg-background p-6 grid grid-cols-2 gap-6">
      {items.map(([n, el]) => (
        <div key={n}><p className="text-xs text-foreground mb-1">{n}</p>{el}</div>
      ))}
    </div>
  );
}
