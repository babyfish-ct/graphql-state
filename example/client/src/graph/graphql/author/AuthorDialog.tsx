import { Modal, Form, Input, Collapse } from "antd";
import { useForm } from "antd/lib/form/Form";
import { ModelType } from "graphql-ts-client-api";
import { FC, memo, useCallback, useEffect } from "react";
import UUIDClass from "uuidjs";
import { author$$, book$, mutation$ } from "../../__generated_graphql_schema__/fetchers";
import { AuthorInput } from "../../__generated_graphql_schema__/inputs";
import { BookMultiSelect } from "../book/BookMultiSelect";
import { INFORMATION_CLASS, PSEUDO_CODE_CLASS } from "../Css";
import { useMutation } from "graphql-state";
import { useTypedStateManager } from "../../__generated_graphql_schema__";

const AUTHOR_EDIT_INFO =
    author$$
    .books(book$.id)
;

export const AuthorDialog: FC<{
    value?: ModelType<typeof AUTHOR_EDIT_INFO>,
    onClose: () => void
}> = memo(({value, onClose}) => {

    const [form] = useForm<AuthorInput>();

    useEffect(() => {
        form.setFieldsValue({
            id: value?.id ?? UUIDClass.generate(),
            name: value?.name ?? "",
            bookIds: value?.books?.map(book => book.id) ?? []
        })
    }, [form, value]);

    const stateManager = useTypedStateManager();
    
    const { mutate, loading } = useMutation(
        mutation$.mergeAuthor(AUTHOR_EDIT_INFO),
        {
            onSuccess: data => { 
                stateManager.save(AUTHOR_EDIT_INFO, data.mergeAuthor); 
            }
        }
    )

    const onOk = useCallback(async () => {
        const input = await form.validateFields();
        await mutate({input});
        onClose();
    }, [form, mutate, onClose]);

    const onCancel = useCallback(() => {
        onClose();
    }, [onClose]);

    return (
        <Modal
        visible={true}
        title={`${value === undefined ? 'Create' : 'Edit'} Author`}
        onOk={onOk}
        onCancel={onCancel}
        width={1000}
        okButtonProps={{loading}}>
            <Form form={form}  labelCol={{span: 8}} wrapperCol={{span: 16}}>
                <Form.Item name="id" hidden={true}/>
                <Form.Item label="Name" name="name">
                    <Input autoComplete="off"/>
                </Form.Item>
                {NAME_DESCRIPTION_ITEM}
                <Form.Item label="Books" name="bookIds">
                    <BookMultiSelect/>
                </Form.Item>
                {BOOKS_DESCRIPTION_ITEM}
            </Form>
        </Modal>
    );
});


const FOR_NEW_NAME = `
for (const parameterizedAuthors of 
    cache.get(Query.findAuthors({...}))
) {
    // user optimizer or default optimizer
    const optimizer = assocaitionProperties["Query.findAuthors"];

    const dependencies = optimizer.dependencies(
        parameterizedAuthors.variables
    );

    if (dependencies === undefined || dependencies.has("name)) {
        const contains = optimizer.contains(this with newName);
        if (contains === true) {
            parameterizedAuthors.addIfAbsent(this);
        } else (contains === false) {
            parameterizedAuthors.removeIfExists(this);
        } else {
            cache.evict(parameterizedAuthors);
            // Affected UI will reload data from server later
        }
    }

    for (const parameterizedAuthors of 
        cache.get(Book::authors({...}))
    ) {

        // user optimizer or default optimizer
        const optimizer = assocaitionProperties["Book.authors"];

        const dependencies = optimizer.dependencies(
            parameterizedAuthors.variables
        );
    
        if (dependencies === undefined || dependencies.has("name)) {
            cache.evict(parameterizedAuthors);
            // Affected UI will reload data from server later
        }
    }
}
`;

const NAME_DESCRIPTION_ITEM = (
    <Form.Item label=" " colon={false}>
        <Collapse ghost>
            <Collapse.Panel key="title" header="Description of 'Book.name'">
                <div className={INFORMATION_CLASS}>
                    If you change this scalar field "BookStore.name" by any of the following ways
                    <ul>
                        <li>insert: undefined -&gt; newName</li>
                        <li>update: oldName -&gt; newName</li>
                    </ul>
                    (delete will be handed by other rules)
                    <pre className={PSEUDO_CODE_CLASS}>{FOR_NEW_NAME}</pre>
                </div>
            </Collapse.Panel>
        </Collapse>
    </Form.Item>
);

const FOR_REMOVED_BOOK = `

// Remove it from similar assocaitons with parameters
for (const parameterizedBooks of cache.get(this.books({...}))) {
    parameterizedBooks.remove(removedBook);
}

if (cached(removeBook.authors)) {
    removeBook.authors.remove(this);
}`;

const FOR_ADDED_BOOK = `

// Add it into similar assocaitons with parameters
for (const parameterizedBooks of cache.get(this.books({...}))) {

    // user optimizer or default optimizer
    const optimizer = assocaitionProperties["Author.books"];

    const contains = optimizer.contains(
        parameterizedBooks.variables, 
        addedBook
    );
    if (contains === true) {
        parameterizedBooks.insert(..., addedBook);
    } else if (contains === false) {
        // do nothing
    } else {
        cahce.evict(parameterizedBooks);
        // Affected UI will reload data from server later
    }
}

// Change opposite endpoint if it's cached
if (cached(addedBook.authors({...}))) {
    addedBook.authors({...}).add(this);
}`;

const BOOKS_DESCRIPTION_ITEM = (
    <Form.Item label=" " colon={false}>
        <Collapse ghost>
            <Collapse.Panel key="title" header="Description of 'Author.books'">
                <div className={INFORMATION_CLASS}>
                    If you change this association "Author.books"
                    <ul>
                        <li>
                            For each removed book, this behavior will be executed automatically
                            <pre className={PSEUDO_CODE_CLASS}>{FOR_REMOVED_BOOK}</pre>
                        </li>
                        <li>
                            For each add book, this behavior will be executed automatically
                            <pre className={PSEUDO_CODE_CLASS}>{FOR_ADDED_BOOK}</pre>
                        </li>
                    </ul>
                </div>
            </Collapse.Panel>
        </Collapse>
    </Form.Item>
);