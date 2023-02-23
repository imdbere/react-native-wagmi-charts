import * as React from 'react';
import { StyleSheet } from 'react-native';
import {
  GestureEvent,
  PanGestureHandler,
  PanGestureHandlerProps,
  PanGestureHandlerEventPayload
} from 'react-native-gesture-handler';
import Animated, { useAnimatedGestureHandler } from 'react-native-reanimated';
import { parse } from 'react-native-redash';

import { LineChartDimensionsContext } from './Chart';
import { useLineChart } from './useLineChart';

export type LineChartCursorProps = PanGestureHandlerProps & {
  children: React.ReactNode;
  type: 'line' | 'crosshair';
};

export const CursorContext = React.createContext({ type: '' });

LineChartCursor.displayName = 'LineChartCursor';

export function LineChartCursor({
  children,
  type,
  ...props
}: LineChartCursorProps) {
  const { pathWidth: width, path } = React.useContext(
    LineChartDimensionsContext
  );
  const { currentX, currentIndex, isActive, data } = useLineChart();

  const parsedPath = React.useMemo(
    () => (path ? parse(path) : undefined),
    [path]
  );

  const onGestureEvent = useAnimatedGestureHandler<
    GestureEvent<PanGestureHandlerEventPayload>
  >({
    onActive: ({ x }) => {
      if (parsedPath) {
        const boundedX = x <= width ? x : width;
        isActive.value = true;
        currentX.value = boundedX;

        // on Web, we could drag the cursor to be negative, breaking it
        // so we clamp the index at 0 to fix it
        // https://github.com/coinjar/react-native-wagmi-charts/issues/24
        const minIndex = 0;
        const boundedIndex = Math.max(
          minIndex,
          Math.round(boundedX / width / (1 / (data.length - 1)))
        );

        currentIndex.value = boundedIndex;
      }
    },
    onEnd: () => {
      isActive.value = false;
      currentIndex.value = -1;
    },
  });

  return (
    <CursorContext.Provider value={{ type }}>
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        activeOffsetY={[-999, 999]}
        activeOffsetX={[-10, 10]}
        failOffsetY={[-10, 10]}
        shouldCancelWhenOutside={false}
        {...props}
      >
        <Animated.View style={StyleSheet.absoluteFill}>
          {children}
        </Animated.View>
      </PanGestureHandler>
    </CursorContext.Provider>
  );
}
