import {test} from 'node:test'
import assert from 'node:assert/strict'
import {cleanPdfText,extractionQuality,pageText,reflowParagraph} from '../src/productivity/pdfText.ts'
import {detectedLanguage} from '../src/productivity/translation.ts'
import {pdfError} from '../src/productivity/pdfErrors.ts'
import {boundedPageScale} from '../src/productivity/renderBudget.ts'
const at=(str,x,y)=>({str,transform:[12,0,0,12,x,y],height:12,hasEOL:true})
test('PDF extraction handles ligatures, separate columns and rows, damaged text and CJK line wraps',()=>{assert.equal(cleanPdfText('  ﬁle\u0000\n\n\ntext\u00ad  '),'file\n\ntext');const items=[at('Right top',350,700),at('Left top',50,700),at('Left bottom',50,680),at('Right bottom',350,680)];const columns=pageText(items,'columns');assert.ok(columns.indexOf('Left bottom')<columns.indexOf('Right top'));const rows=pageText(items,'rows');assert.ok(rows.indexOf('Right top')<rows.indexOf('Left bottom'));assert.equal(extractionQuality(' \n'),'empty');assert.equal(extractionQuality('□□□�broken'),'damaged');assert.equal(extractionQuality('Chapter 1'),'readable');assert.equal(reflowParagraph('学習\n計画'),'学習計画');assert.equal(reflowParagraph('Study\nplan'),'Study plan')})
test('source language detection is conservative for short text and recognizes full passages',()=>{assert.equal(detectedLanguage('これは日本語の文章です。学習の計画を立てましょう。'),'ja');assert.equal(detectedLanguage('The book describes how to plan your tasks and organize your study with the right tools.'),'en');assert.equal(detectedLanguage('Chapter 1'),null)})
test('PDF errors distinguish encrypted, damaged and missing documents',()=>{assert.match(pdfError({name:'PasswordException'}),/password/);assert.match(pdfError({name:'InvalidPDFException'}),/damaged/);assert.equal(pdfError({name:'MissingPDFException'}),'PDF not found.')})
test('PDF and OCR raster budgets contain huge pages and extreme aspect ratios before canvas allocation',()=>{
 for(const[width,height]of [[612,792],[100000,100000],[1,1e12],[1e12,1],[1e150,1e150]]){const scale=boundedPageScale(width,height,2.5),w=Math.max(1,Math.ceil(width*scale)),h=Math.max(1,Math.ceil(height*scale));assert.ok(w<=8192&&h<=8192);assert.ok(w*h<=4000000)}
 for(const size of [0,-1,NaN,Infinity])assert.throws(()=>boundedPageScale(size,792,1),RangeError)
 assert.throws(()=>boundedPageScale(Number.MAX_VALUE,Number.MAX_VALUE,1),RangeError)
 assert.equal(boundedPageScale(612,792,1),1)
})
