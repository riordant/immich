import type { EditActions } from '$lib/managers/edit/edit-manager.svelte';
import { buildAffineFromEdits, mergeTransformEdits, normalizeTransformEdits, normalizedTransformToEdits } from '$lib/utils/editor';
import { AssetEditAction, MirrorAxis } from '@immich/sdk';

const normalizedToEdits = normalizedTransformToEdits;

function compareEditAffines(editsA: EditActions, editsB: EditActions): boolean {
  const normA = buildAffineFromEdits(editsA);
  const normB = buildAffineFromEdits(editsB);

  return (
    Math.abs(normA.a - normB.a) < 0.0001 &&
    Math.abs(normA.b - normB.b) < 0.0001 &&
    Math.abs(normA.c - normB.c) < 0.0001 &&
    Math.abs(normA.d - normB.d) < 0.0001
  );
}

describe('edit normalization', () => {
  it('should handle no edits', () => {
    const edits: EditActions = [];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle a single 90° rotation', () => {
    const edits: EditActions = [{ action: AssetEditAction.Rotate, parameters: { angle: 90 } }];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle a single 180° rotation', () => {
    const edits: EditActions = [{ action: AssetEditAction.Rotate, parameters: { angle: 180 } }];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle a single 270° rotation', () => {
    const edits: EditActions = [{ action: AssetEditAction.Rotate, parameters: { angle: 270 } }];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle a single horizontal mirror', () => {
    const edits: EditActions = [{ action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal } }];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle a single vertical mirror', () => {
    const edits: EditActions = [{ action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Vertical } }];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle 90° rotation + horizontal mirror', () => {
    const edits: EditActions = [
      { action: AssetEditAction.Rotate, parameters: { angle: 90 } },
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal } },
    ];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle 90° rotation + vertical mirror', () => {
    const edits: EditActions = [
      { action: AssetEditAction.Rotate, parameters: { angle: 90 } },
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Vertical } },
    ];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle 90° rotation + both mirrors', () => {
    const edits: EditActions = [
      { action: AssetEditAction.Rotate, parameters: { angle: 90 } },
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal } },
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Vertical } },
    ];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle 180° rotation + horizontal mirror', () => {
    const edits: EditActions = [
      { action: AssetEditAction.Rotate, parameters: { angle: 180 } },
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal } },
    ];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle 180° rotation + vertical mirror', () => {
    const edits: EditActions = [
      { action: AssetEditAction.Rotate, parameters: { angle: 180 } },
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Vertical } },
    ];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle 180° rotation + both mirrors', () => {
    const edits: EditActions = [
      { action: AssetEditAction.Rotate, parameters: { angle: 180 } },
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal } },
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Vertical } },
    ];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle 270° rotation + horizontal mirror', () => {
    const edits: EditActions = [
      { action: AssetEditAction.Rotate, parameters: { angle: 270 } },
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal } },
    ];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle 270° rotation + vertical mirror', () => {
    const edits: EditActions = [
      { action: AssetEditAction.Rotate, parameters: { angle: 270 } },
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Vertical } },
    ];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle 270° rotation + both mirrors', () => {
    const edits: EditActions = [
      { action: AssetEditAction.Rotate, parameters: { angle: 270 } },
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal } },
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Vertical } },
    ];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle horizontal mirror + 90° rotation', () => {
    const edits: EditActions = [
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal } },
      { action: AssetEditAction.Rotate, parameters: { angle: 90 } },
    ];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle horizontal mirror + 180° rotation', () => {
    const edits: EditActions = [
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal } },
      { action: AssetEditAction.Rotate, parameters: { angle: 180 } },
    ];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle horizontal mirror + 270° rotation', () => {
    const edits: EditActions = [
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal } },
      { action: AssetEditAction.Rotate, parameters: { angle: 270 } },
    ];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle vertical mirror + 90° rotation', () => {
    const edits: EditActions = [
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Vertical } },
      { action: AssetEditAction.Rotate, parameters: { angle: 90 } },
    ];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle vertical mirror + 180° rotation', () => {
    const edits: EditActions = [
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Vertical } },
      { action: AssetEditAction.Rotate, parameters: { angle: 180 } },
    ];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle vertical mirror + 270° rotation', () => {
    const edits: EditActions = [
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Vertical } },
      { action: AssetEditAction.Rotate, parameters: { angle: 270 } },
    ];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle both mirrors + 90° rotation', () => {
    const edits: EditActions = [
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal } },
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Vertical } },
      { action: AssetEditAction.Rotate, parameters: { angle: 90 } },
    ];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle both mirrors + 180° rotation', () => {
    const edits: EditActions = [
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal } },
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Vertical } },
      { action: AssetEditAction.Rotate, parameters: { angle: 180 } },
    ];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('should handle both mirrors + 270° rotation', () => {
    const edits: EditActions = [
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal } },
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Vertical } },
      { action: AssetEditAction.Rotate, parameters: { angle: 270 } },
    ];

    const result = normalizeTransformEdits(edits);
    const normalizedEdits = normalizedToEdits(result);

    expect(compareEditAffines(normalizedEdits, edits)).toBe(true);
  });

  it('preserves existing crop edits when merging new transform edits', () => {
    const existingEdits: EditActions = [
      {
        action: AssetEditAction.Crop,
        parameters: { x: 10, y: 20, width: 100, height: 80 },
      },
      {
        action: AssetEditAction.Rotate,
        parameters: { angle: 90 },
      },
    ];

    const merged = mergeTransformEdits(existingEdits, [
      { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal } },
    ]);

    expect(merged[0]).toEqual(existingEdits[0]);
    expect(
      compareEditAffines(merged.slice(1), [
        { action: AssetEditAction.Rotate, parameters: { angle: 90 } },
        { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal } },
      ]),
    ).toBe(true);
  });
});
