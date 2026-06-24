import { useMemo, useState } from 'react';
import {
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

import { palette } from '../../../theme/palette';
import { BoundingBox } from '../types';

type DetectionOverlayProps = {
  boxes: BoundingBox[];
  imageHeight?: number;
  imageWidth?: number;
  labelColor?: string;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

export function DetectionOverlay({
  boxes,
  imageHeight,
  imageWidth,
  labelColor = palette.danger,
  style,
  children,
}: DetectionOverlayProps) {
  const [layout, setLayout] = useState({ height: 0, width: 0 });

  const scaledBoxes = useMemo(() => {
    if (!imageWidth || !imageHeight || layout.width <= 0 || layout.height <= 0) {
      return [];
    }

    const scaleX = layout.width / imageWidth;
    const scaleY = layout.height / imageHeight;

    return boxes.map((box, index) => ({
      confidence: Math.round((box.confidence ?? 0) * 100),
      height: Math.max(1, box.height * scaleY),
      key: `${index}-${box.x1}-${box.y1}`,
      left: box.x1 * scaleX,
      top: box.y1 * scaleY,
      width: Math.max(1, box.width * scaleX),
    }));
  }, [boxes, imageHeight, imageWidth, layout.height, layout.width]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { height, width } = event.nativeEvent.layout;
    setLayout({ height, width });
  };

  return (
    <View onLayout={handleLayout} style={[styles.container, style]}>
      {children}
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        {scaledBoxes.map((box) => (
          <View
            key={box.key}
            style={[
              styles.box,
              {
                borderColor: labelColor,
                height: box.height,
                left: box.left,
                top: box.top,
                width: box.width,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  box: {
    borderRadius: 12,
    borderWidth: 2,
    position: 'absolute',
  },
});
