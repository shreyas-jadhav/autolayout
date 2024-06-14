import { cloneDeep } from "lodash";
import { useState } from "react";
import ReactGridLayout, { ReactGridLayoutProps } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "./App.css";
import { Desktop, Mobile, Tablet } from "./Layouts";
import { sync } from "./utils";

type Layout = ReactGridLayoutProps["layout"];
const initialLayout = [
  { i: "a", x: 0, y: 0, w: 2, h: 2 },
  { i: "b", x: 2, y: 0, w: 1, h: 1 },
  { i: "c", x: 2, y: 1, w: 1, h: 1 },
  { i: "d", x: 4, y: 0, w: 1, h: 2 },
] as ReactGridLayout.Layout[];
function App() {
  const [layouts, setLayouts] = useState<{
    Desktop: Layout;
    Tablet: Layout;
    Mobile: Layout;
  }>({
    Desktop: initialLayout,
    Tablet: sync(sync(initialLayout, 3, "vertical"), 3, "horizontal"),
    Mobile: sync(sync(initialLayout, 2, "vertical"), 2, "horizontal"),
  });

  const views = [
    {
      name: "Desktop",
      component: Desktop,
      cols: 4,
    },
    {
      name: "Tablet",
      component: Tablet,
      cols: 3,
    },
    {
      name: "Mobile",
      component: Mobile,
      cols: 2,
    },
  ] as const;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
      }}
    >
      {views.map((view) => {
        return (
          <div
            key={view.name}
            style={{
              margin: "20px",
              height: "100vh",
              width: window.innerWidth / 3,
              border: "1px solid black",
            }}
          >
            <h2>{view.name}</h2>

            <ReactGridLayout
              layout={layouts[view.name]}
              cols={view.cols}
              width={window.innerWidth / 3 - 40}
              rowHeight={100}
              containerPadding={[30, 30]}
              margin={[10, 10]}
              preventCollision
              isDraggable
              onResize={(layout) =>
                setLayouts((prev) => {
                  const newLayouts = cloneDeep(prev);
                  newLayouts[view.name] = layout;
                  return newLayouts;
                })
              }
              onDragStop={(layout) => {
                console.log(`setting layout for ${view.name}`);
                setLayouts((prev) => {
                  const newLayouts = cloneDeep(prev);
                  (
                    Object.keys(newLayouts) as (keyof typeof newLayouts)[]
                  ).forEach((key) => {
                    if (key === view.name) {
                      newLayouts[key] = sync(layout, view.cols, "vertical");

                      console.log("new layout", newLayouts[key]);
                    } else {
                      // only auto adjust if this layout has less cols than the current view
                      if (
                        view.cols <= views.find((v) => v.name === key)!.cols
                      ) {
                        return;
                      }

                      const vCompacted = sync(
                        layout,
                        views.find((v) => v.name === key)!.cols,
                        "vertical",
                        newLayouts[key]
                      );

                      newLayouts[key] = sync(
                        vCompacted,
                        views.find((v) => v.name === view.name)!.cols,
                        "horizontal"
                      );

                      console.log("calculated for ", key);
                    }
                  });
                  return newLayouts;
                });
              }}
            >
              {layouts[view.name]?.map((item) => (
                <div key={item.i}>{item.i}</div>
              ))}
            </ReactGridLayout>
          </div>
        );
      })}
    </div>
  );
}

export default App;
