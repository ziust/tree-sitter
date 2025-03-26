import XCTest
import SwiftTreeSitter
import TreeSitterZiust

final class TreeSitterZiustTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_ziust())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Ziust grammar")
    }
}
