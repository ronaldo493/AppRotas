import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Animated,
  PanResponder,
  type PanResponderInstance,
} from 'react-native';
import {useCallback, useEffect, useMemo, useRef} from 'react';

interface FloatingActionPosition {
  x: number;
  y: number;
}

const DEFAULT_POSITION: FloatingActionPosition = {x: 0, y: 0};

const isFloatingActionPosition = (
  value: unknown,
): value is FloatingActionPosition => {
  if (!value || typeof value !== 'object') return false;
  const position = value as Partial<FloatingActionPosition>;
  return typeof position.x === 'number' && typeof position.y === 'number';
};

/** Controla o arraste de uma ação flutuante e restaura sua posição no aparelho. */
export default function useFloatingActionPosition(storageKey: string) {
  const position = useRef(new Animated.ValueXY()).current;
  const savedPosition = useRef<FloatingActionPosition>(DEFAULT_POSITION);

  useEffect(() => {
    const loadPosition = async (): Promise<void> => {
      try {
        const storageValue = await AsyncStorage.getItem(storageKey);
        if (!storageValue) return;

        const parsedValue: unknown = JSON.parse(storageValue);
        if (!isFloatingActionPosition(parsedValue)) return;

        savedPosition.current = parsedValue;
        position.setValue(parsedValue);
      } catch {
        // A posição padrão continua válida quando o armazenamento está indisponível.
      }
    };

    void loadPosition();
  }, [position, storageKey]);

  const finishDrag = useCallback((dx: number, dy: number): void => {
    const newPosition: FloatingActionPosition = {
      x: savedPosition.current.x + dx,
      y: savedPosition.current.y + dy,
    };

    position.flattenOffset();
    position.setValue(newPosition);
    savedPosition.current = newPosition;
    void AsyncStorage.setItem(storageKey, JSON.stringify(newPosition));
  }, [position, storageKey]);

  const panResponder: PanResponderInstance = useMemo(
    () => PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5,
      onPanResponderGrant: () => {
        position.setOffset(savedPosition.current);
        position.setValue(DEFAULT_POSITION);
      },
      onPanResponderMove: Animated.event(
        [null, {dx: position.x, dy: position.y}],
        {useNativeDriver: false},
      ),
      onPanResponderRelease: (_, gesture) => finishDrag(gesture.dx, gesture.dy),
      onPanResponderTerminate: (_, gesture) => finishDrag(gesture.dx, gesture.dy),
    }),
    [finishDrag, position],
  );

  return {
    panHandlers: panResponder.panHandlers,
    transform: position.getTranslateTransform(),
  };
}
