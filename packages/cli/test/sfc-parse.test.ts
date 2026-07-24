import { describe, expect, it } from 'vitest';
import {
  findAttribute,
  kebabToPascal,
  parseVueFile,
  pascalToKebab,
  tagMatchesComponent,
  walkTemplate,
} from '../src/parse/sfc.js';

const SFC = `<script setup lang="ts">
import { Button } from '@/components/ui/button';
</script>

<template>
  <div>
    <Button variant="ghost">Hi</Button>
    <alert-dialog v-if="open" />
    <img :alt="dynamic" src="/x.png" />
  </div>
</template>
`;

describe('sfc parsing', () => {
  it('exposes the template AST with element locations', () => {
    const parsed = parseVueFile('App.vue', SFC);
    expect(parsed.errors).toHaveLength(0);
    expect(parsed.templateAst).toBeDefined();
    const tags: { tag: string; line: number }[] = [];
    walkTemplate(parsed.templateAst!, (element) => {
      tags.push({ tag: element.tag, line: element.loc.start.line });
    });
    expect(tags.map((entry) => entry.tag)).toEqual(['div', 'Button', 'alert-dialog', 'img']);
    expect(tags[1]!.line).toBe(7);
  });

  it('walks v-if branches', () => {
    const parsed = parseVueFile(
      'Cond.vue',
      '<template><div v-if="a"><span/></div><p v-else/></template>',
    );
    const tags: string[] = [];
    walkTemplate(parsed.templateAst!, (element) => {
      tags.push(element.tag);
    });
    expect(tags).toContain('div');
    expect(tags).toContain('p');
    expect(tags).toContain('span');
  });

  it('finds static and bound attributes', () => {
    const parsed = parseVueFile('Attr.vue', '<template><img alt="x" :src="y" /></template>');
    let checked = false;
    walkTemplate(parsed.templateAst!, (element) => {
      if (element.tag !== 'img') {
        return;
      }
      checked = true;
      expect(findAttribute(element, 'alt')).toMatchObject({ static: 'x', bound: false });
      expect(findAttribute(element, 'src')).toMatchObject({ bound: true });
      expect(findAttribute(element, 'title')).toBeUndefined();
    });
    expect(checked).toBe(true);
  });

  it('normalizes component name casing both ways', () => {
    expect(pascalToKebab('AlertDialog')).toBe('alert-dialog');
    expect(pascalToKebab('NuxtImg')).toBe('nuxt-img');
    expect(kebabToPascal('alert-dialog')).toBe('AlertDialog');
    expect(tagMatchesComponent('alert-dialog', 'AlertDialog')).toBe(true);
    expect(tagMatchesComponent('AlertDialog', 'AlertDialog')).toBe(true);
    expect(tagMatchesComponent('dialog', 'AlertDialog')).toBe(false);
  });
});
