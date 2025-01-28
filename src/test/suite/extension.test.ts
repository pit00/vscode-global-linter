import * as assert from 'assert';
import * as vscode from 'vscode';

import * as red from '../../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Exports "activate" function', () => {
		assert.ok(red.activate, 'Missing activate export');
	});

  test('Provides declared configuration', () => {
    const config = vscode.workspace.getConfiguration('global-linter');

    assert.ok(config.has('rules'));
  });
});
