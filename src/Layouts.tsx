import GridLayout, { Layout } from "react-grid-layout";

type Props = {
  layout: Layout[];
};

export const Desktop = ({ layout }: Props) => {
  return (
    <GridLayout
      layout={layout}
      cols={4}
      width={300}
      rowHeight={40}
      allowOverlap={false}
      containerPadding={[30, 30]}
      margin={[10, 10]}
    >
      {layout.map((item) => (
        <div key={item.i}>{item.i}</div>
      ))}
    </GridLayout>
  );
};

export const Mobile = ({ layout }: Props) => {
  return (
    <GridLayout
      layout={layout}
      width={300}
      cols={2}
      rowHeight={30}
      allowOverlap={false}
      containerPadding={[30, 30]}
      margin={[10, 10]}
    >
      {layout.map((item) => (
        <div key={item.i}>{item.i}</div>
      ))}
    </GridLayout>
  );
};

export const Tablet = ({ layout }: Props) => {
  return (
    <GridLayout
      layout={layout}
      width={300}
      cols={3}
      rowHeight={30}
      allowOverlap={false}
      containerPadding={[30, 30]}
      margin={[10, 10]}
    >
      {layout.map((item) => (
        <div key={item.i}>{item.i}</div>
      ))}
    </GridLayout>
  );
};
